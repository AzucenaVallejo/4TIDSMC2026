using FirebaseAdmin;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PortafolioDeEvidencias.DTOs;
using PortafolioDeEvidencias.Services;

namespace PortafolioDeEvidencias.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AutenticacionController : ControllerBase
    {
        private readonly FirebaseAuth _firebaseAuth;
        private readonly FirebaseService _firebaseService;

        public AutenticacionController(
            FirebaseApp firebaseApp,
            FirebaseService firebaseService)
        {
            _firebaseAuth = FirebaseAuth.GetAuth(firebaseApp);
            _firebaseService = firebaseService;
        }

        [HttpPost("sesion")]
        public async Task<IActionResult> CrearSesion(
            [FromBody] FirebaseSessionDto datos)
        {
            try
            {
                var token = await _firebaseAuth.VerifyIdTokenAsync(datos.IdToken);

                string correo = token.Claims.ContainsKey("email")
                    ? token.Claims["email"]?.ToString() ?? ""
                    : "";

                string nombre = token.Claims.ContainsKey("name")
                    ? token.Claims["name"]?.ToString() ?? ""
                    : "";

                if (string.IsNullOrWhiteSpace(nombre))
                {
                    nombre = correo.Split('@')[0];
                }

                // Guardar perfil en Firestore
                await _firebaseService.GuardarUsuario(
                    token.Uid,
                    nombre,
                    correo
                );

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, token.Uid),
                    new Claim(ClaimTypes.Email, correo),
                    new Claim(ClaimTypes.Name, nombre)
                };

                var identidad = new ClaimsIdentity(
                    claims,
                    CookieAuthenticationDefaults.AuthenticationScheme
                );

                var usuario = new ClaimsPrincipal(identidad);

                await HttpContext.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    usuario,
                    new AuthenticationProperties
                    {
                        IsPersistent = true,
                        ExpiresUtc = DateTimeOffset.UtcNow.AddHours(8)
                    }
                );

                return Ok(new
                {
                    mensaje = "Sesión iniciada correctamente.",
                    usuarioId = token.Uid,
                    correo = correo,
                    nombre = nombre
                });
            }
            catch (FirebaseAuthException)
            {
                return Unauthorized(new
                {
                    mensaje = "El token de autenticación no es válido."
                });
            }
        }

        [HttpPost("cerrar")]
        public async Task<IActionResult> CerrarSesion()
        {
            await HttpContext.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme
            );

            return Ok(new
            {
                mensaje = "Sesión cerrada correctamente."
            });
        }
    }
}
