
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PortafolioDeEvidencias.DTOs;
using PortafolioDeEvidencias.Services;

namespace PortafolioDeEvidencias.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PortafolioController : ControllerBase
    {
        private readonly FirebaseService _firebase;

        public PortafolioController(FirebaseService firebase)
        {
            _firebase = firebase;
        }

        // Obtener el portafolio del usuario actual
        [HttpGet]
        public async Task<IActionResult> Obtener()
        {
            try
            {
                string uid = User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!;

                var portafolio =
                    await _firebase.ObtenerPortafolio(uid);

                return Ok(portafolio);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo recuperar el portafolio."
                });
            }
        }

        // Guardar el portafolio del usuario actual
        [HttpPost]
        public async Task<IActionResult> Guardar(
            [FromBody] PortafolioDto datos)
        {
            try
            {
                string uid = User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!;

                await _firebase.GuardarPortafolio(uid, datos);

                return Ok(new
                {
                    mensaje = "Portafolio guardado correctamente."
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo guardar el portafolio."
                });
            }
        }
    }
}
