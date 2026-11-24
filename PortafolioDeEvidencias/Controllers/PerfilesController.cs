using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PortafolioDeEvidencias.Data;
using PortafolioDeEvidencias.DTOs;
using PortafolioDeEvidencias.Models;

namespace PortafolioDeEvidencias.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PerfilesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PerfilesController(AppDbContext context)
        {
            _context = context;
        }

        // CONSULTAR PERFIL
        [HttpGet("{usuarioId}")]
        public async Task<IActionResult> ObtenerPerfil(int usuarioId)
        {
            var perfil = await _context.Perfiles
                .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId);

            if (perfil == null)
            {
                return NotFound(new
                {
                    mensaje = "El perfil todavía no ha sido registrado."
                });
            }

            return Ok(perfil);
        }

        // REGISTRAR O ACTUALIZAR PERFIL
        [HttpPost("{usuarioId}")]
        public async Task<IActionResult> GuardarPerfil(
            int usuarioId, PerfilDto datos)
        {
            var usuario = await _context.Usuarios
                .FindAsync(usuarioId);

            if (usuario == null || !usuario.Activo)
            {
                return NotFound(new
                {
                    mensaje = "El usuario no existe."
                });
            }

            var perfil = await _context.Perfiles
                .FirstOrDefaultAsync(p => p.UsuarioId == usuarioId);

            if (perfil == null)
            {
                perfil = new Perfil
                {
                    UsuarioId = usuarioId
                };

                _context.Perfiles.Add(perfil);
            }

            perfil.Nombres = datos.Nombres.Trim();
            perfil.ApellidoPaterno = datos.ApellidoPaterno.Trim();
            perfil.ApellidoMaterno = datos.ApellidoMaterno.Trim();
            perfil.FechaNacimiento = datos.FechaNacimiento;
            perfil.Telefono = datos.Telefono.Trim();
            perfil.Correo = datos.Correo.Trim();
            perfil.CURP = datos.CURP.Trim();
            perfil.Domicilio = datos.Domicilio.Trim();
            perfil.Fotografia = datos.Fotografia;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje = "Perfil guardado correctamente.",
                perfilId = perfil.Id
            });
        }
    }
}
