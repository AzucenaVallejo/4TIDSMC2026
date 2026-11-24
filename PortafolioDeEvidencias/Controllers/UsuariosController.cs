
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PortafolioDeEvidencias.Data;
using PortafolioDeEvidencias.DTOs;
using PortafolioDeEvidencias.Models;

namespace PortafolioDeEvidencias.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsuariosController(AppDbContext context)
        {
            _context = context;
        }

        // REGISTRO DE USUARIOS
        [HttpPost("registro")]
        public async Task<IActionResult> Registrar(
            RegistroUsuarioDto datos)
        {
            string correo = datos.Correo.Trim().ToLowerInvariant();

            // Revisar si el correo ya está registrado
            bool existe = await _context.Usuarios
                .AnyAsync(u => u.Correo == correo);

            if (existe)
            {
                return Conflict(new
                {
                    mensaje = "Este correo ya está registrado."
                });
            }

            // Crear el nuevo usuario
            var usuario = new Usuario
            {
                NombreUsuario = datos.NombreUsuario.Trim(),
                Correo = correo
            };

            // Proteger la contraseña mediante un hash seguro
            var hasher = new PasswordHasher<Usuario>();

            usuario.Contrasena = hasher.HashPassword(
                usuario,
                datos.Contrasena
            );

            _context.Usuarios.Add(usuario);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Usuario registrado correctamente."
            });
        }

        // INICIO DE SESIÓN
        [HttpPost("login")]
        public async Task<IActionResult> IniciarSesion(
            LoginUsuarioDto datos)
        {
            string correo = datos.Correo.Trim().ToLowerInvariant();

            // Buscar al usuario por su correo
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo == correo);

            if (usuario == null || !usuario.Activo)
            {
                return Unauthorized(new
                {
                    mensaje = "Correo o contraseña incorrectos."
                });
            }

            // Comprobar la contraseña
            var hasher = new PasswordHasher<Usuario>();

            var resultado = hasher.VerifyHashedPassword(
                usuario,
                usuario.Contrasena,
                datos.Contrasena
            );

            if (resultado == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    mensaje = "Correo o contraseña incorrectos."
                });
            }

            return Ok(new
            {
                mensaje = "Inicio de sesión correcto.",
                usuarioId = usuario.Id,
                nombre = usuario.NombreUsuario
            });
        }
    }
}
