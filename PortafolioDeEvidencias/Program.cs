using Microsoft.AspNetCore.Authentication.Cookies;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddAuthorization();
builder.Services.AddAuthentication(
    CookieAuthenticationDefaults.AuthenticationScheme
)
.AddCookie(options =>
{
    options.Cookie.Name = "Portafolio.Auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.ExpireTimeSpan = TimeSpan.FromHours(8);
    options.SlidingExpiration = true;

    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };

    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

// Configuración de Firebase
var projectId = builder.Configuration["Firebase:ProjectId"]
    ?? throw new Exception("No se encontró el Project ID de Firebase.");

var credentialsPath = builder.Configuration["Firebase:CredentialsPath"]
    ?? throw new Exception("No se encontró la ruta de las credenciales.");

var credential = GoogleCredential.FromFile(credentialsPath);

// Inicializar Firebase Admin
var firebaseApp = FirebaseApp.Create(new AppOptions
{
    Credential = credential,
    ProjectId = projectId
});

builder.Services.AddSingleton(firebaseApp);

// Conexión con Cloud Firestore
var firestore = new FirestoreDbBuilder
{
    ProjectId = projectId,
    Credential = credential
}.Build();

builder.Services.AddSingleton(firestore);
builder.Services.AddScoped<PortafolioDeEvidencias.Services.FirebaseService>();
builder.Services.AddScoped<PortafolioDeEvidencias.Services.CloudinaryService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
