
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Security;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Services;

using PortalEvidencias.Infraestructura.Data;
using PortalEvidencias.Infraestructura.Options;
using PortalEvidencias.Infraestructura.Repositories;
using PortalEvidencias.Infraestructura.Security;
using PortalEvidencias.Infraestructura.Services;
using PortalEvidencias.Infraestructura.Settings;

using PortalEvidencias.Extensions;
using PortalEvidencias.Middleware;

using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// CONFIGURACIÓN DE OPCIONES
// ==========================================

// JWT.
builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(JwtOptions.SectionName));

// Google.
builder.Services.Configure<GoogleOptions>(
    builder.Configuration.GetSection(GoogleOptions.SectionName));

// Correo electrónico.
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings"));

// ==========================================
// VALIDACIÓN DE CONFIGURACIÓN JWT
// ==========================================

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "No se encontró la configuración JWT.");

if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey) ||
    Encoding.UTF8.GetByteCount(jwtOptions.SecretKey) < 32)
{
    throw new InvalidOperationException(
        "La clave JWT debe estar configurada y tener al menos 32 bytes.");
}

if (string.IsNullOrWhiteSpace(jwtOptions.Issuer) ||
    string.IsNullOrWhiteSpace(jwtOptions.Audience))
{
    throw new InvalidOperationException(
        "El emisor y la audiencia JWT deben estar configurados.");
}

// ==========================================
// BASE DE DATOS
// ==========================================

builder.Services.AddDbContext<PortalEvidenciasDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// ==========================================
// REPOSITORIOS
// ==========================================

builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IPerfilRepository, PerfilRepository>();
builder.Services.AddScoped<IDocumentoRepository, DocumentoRepository>();
builder.Services.AddScoped<IFormacionRepository, FormacionRepository>();
builder.Services.AddScoped<IActividadRepository, ActividadRepository>();
builder.Services.AddScoped<IProyectoRepository, ProyectoRepository>();
builder.Services.AddScoped<IPracticaRepository, PracticaRepository>();
builder.Services.AddScoped<IExperienciaRepository, ExperienciaRepository>();
builder.Services.AddScoped<IHabilidadRepository, HabilidadRepository>();
builder.Services.AddScoped<IInteresRepository, InteresRepository>();
builder.Services.AddScoped<ICurriculumRepository, CurriculumRepository>();
builder.Services.AddScoped<IEnlacePublicoRepository, EnlacePublicoRepository>();
builder.Services.AddScoped<IConfiguracionPrivacidadRepository, ConfiguracionPrivacidadRepository>();
builder.Services.AddScoped<IVisitaEnlacePublicoRepository, VisitaEnlacePublicoRepository>();
builder.Services.AddScoped<ICuentaExternaRepository, CuentaExternaRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

// Recuperación de contraseña.
builder.Services.AddScoped<
    ISolicitudRecuperacionContrasenaRepository,
    SolicitudRecuperacionContrasenaRepository>();

// ==========================================
// SERVICIOS DE APLICACIÓN
// ==========================================

builder.Services.AddScoped<IPerfilService, PerfilService>();
builder.Services.AddScoped<IDocumentoService, DocumentoService>();
builder.Services.AddScoped<IFormacionService, FormacionService>();
builder.Services.AddScoped<IActividadService, ActividadService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<IPracticaService, PracticaService>();
builder.Services.AddScoped<IExperienciaService, ExperienciaService>();
builder.Services.AddScoped<IHabilidadService, HabilidadService>();
builder.Services.AddScoped<IInteresService, InteresService>();
builder.Services.AddScoped<ICurriculumService, CurriculumService>();
builder.Services.AddScoped<IEnlacePublicoService, EnlacePublicoService>();
builder.Services.AddScoped<IConfiguracionPrivacidadService, ConfiguracionPrivacidadService>();
builder.Services.AddScoped<IVisitaEnlacePublicoService, VisitaEnlacePublicoService>();

// Autenticación.
builder.Services.AddScoped<IAuthService, AuthService>();

// Recuperación de contraseña.
builder.Services.AddScoped<
    IRecuperacionContrasenaService,
    RecuperacionContrasenaService>();

// ==========================================
// SERVICIOS DE INFRAESTRUCTURA
// ==========================================

// Seguridad.
builder.Services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
builder.Services.AddScoped<ITokenService, JwtTokenService>();
builder.Services.AddScoped<IGoogleIdentityService, GoogleIdentityService>();

// Correo electrónico.
builder.Services.AddScoped<IEmailService, EmailService>();

// Generación de documentos.
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurriculumPdfService, CurriculumPdfService>();

// ==========================================
// CORS
// ==========================================

const string frontendOrigin = "https://acuteness-chemist-celestial.ngrok-free.dev";

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendLocal", policy =>
    {
        policy
            .WithOrigins(frontendOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ==========================================
// AUTENTICACIÓN JWT
// ==========================================

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtOptions.Issuer,

            ValidateAudience = true,
            ValidAudience = jwtOptions.Audience,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.SecretKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        // Leer el access token desde la cookie HttpOnly.
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                if (context.Request.Cookies.TryGetValue(
                    "PortalEvidencias.AccessToken",
                    out var token))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ==========================================
// CONTROLADORES Y DOCUMENTACIÓN
// ==========================================

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddMoreModule();

// ==========================================
// CONSTRUCCIÓN DE LA APLICACIÓN
// ==========================================

var app = builder.Build();

// OpenAPI y Scalar únicamente en desarrollo.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

// Enrutamiento explícito.
app.UseRouting();

// CORS debe envolver los middlewares que pueden generar respuestas.
app.UseCors("FrontendLocal");

// Manejo global de excepciones.
app.UseMiddleware<GlobalExceptionMiddleware>();

// ==========================================
// VALIDACIÓN DEL ORIGEN DE LAS SOLICITUDES
// ==========================================

app.Use(async (context, next) =>
{
    bool modificaDatos =
        HttpMethods.IsPost(context.Request.Method) ||
        HttpMethods.IsPut(context.Request.Method) ||
        HttpMethods.IsPatch(context.Request.Method) ||
        HttpMethods.IsDelete(context.Request.Method);

    if (context.Request.Path.StartsWithSegments("/api") &&
        modificaDatos)
    {
        string origen = context.Request.Headers.Origin.ToString();

        if (!string.Equals(
            origen,
            frontendOrigin,
            StringComparison.Ordinal))
        {
            context.Response.StatusCode =
                StatusCodes.Status403Forbidden;

            await context.Response.WriteAsJsonAsync(new
            {
                mensaje = "Origen no autorizado."
            });

            return;
        }
    }

    await next();
});

// ==========================================
// AUTENTICACIÓN Y AUTORIZACIÓN
// ==========================================

app.UseAuthentication();
app.UseAuthorization();

// ==========================================
// CONTROLADORES
// ==========================================

app.MapControllers();

app.Run();
