
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using PortafolioDeEvidencias.Services;

namespace PortafolioDeEvidencias.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ArchivosController : ControllerBase
    {
        private readonly CloudinaryService _cloudinary;
        private readonly FirebaseService _firebase;

        public ArchivosController(
            CloudinaryService cloudinary,
            FirebaseService firebase)
        {
            _cloudinary = cloudinary;
            _firebase = firebase;
        }

        // Subir fotografía de perfil
        [HttpPost("fotografia")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubirFotografia(
            [FromForm] IFormFile archivo)
        {
            try
            {
                string uid = User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!;

                string url = await _cloudinary.SubirFotografia(
                    archivo, uid);

                return Ok(new
                {
                    mensaje = "Fotografía subida correctamente.",
                    url = url
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { mensaje = ex.Message });
            }
        }

        // Subir evidencia
        [HttpPost("evidencia")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> SubirEvidencia(
            [FromForm] IFormFile archivo,
            [FromForm] string nombre,
            [FromForm] string seccion,
            [FromForm] string registroId)
        {
            try
            {
                if (archivo == null || archivo.Length == 0)
                    return BadRequest(new
                    {
                        mensaje = "Selecciona una imagen."
                    });

                if (string.IsNullOrWhiteSpace(nombre) ||
                    string.IsNullOrWhiteSpace(seccion) ||
                    string.IsNullOrWhiteSpace(registroId))
                    return BadRequest(new
                    {
                        mensaje = "Faltan datos de la evidencia."
                    });

                if (nombre.Length > 100 || seccion.Length > 50 ||
                    registroId.Length > 50)
                    return BadRequest(new
                    {
                        mensaje = "Los datos proporcionados son demasiado largos."
                    });

                string uid = User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!;

                string url = await _cloudinary.SubirEvidencia(
                    archivo, uid);

                string id = await _firebase.GuardarEvidencia(
                    uid, registroId, nombre, seccion, url);

                return Ok(new
                {
                    mensaje = "Evidencia guardada correctamente.",
                    id = id,
                    registroId = registroId,
                    nombre = nombre,
                    seccion = seccion,
                    url = url
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo guardar la evidencia."
                });
            }
        }

        // Consultar evidencias del usuario
        [HttpGet("evidencias")]
        public async Task<IActionResult> ObtenerEvidencias()
        {
            try
            {
                string uid = User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!;

                var evidencias = await _firebase.ObtenerEvidencias(uid);

                return Ok(evidencias);
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudieron recuperar las evidencias."
                });
            }
        }

        // Corregir el registro al que pertenece una evidencia
        [HttpPut("evidencia/{evidenciaId}/registro")]
        public async Task<IActionResult> CorregirRegistroEvidencia(
            string evidenciaId,
            [FromBody] string nuevoRegistroId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(evidenciaId) ||
                    string.IsNullOrWhiteSpace(nuevoRegistroId))
                {
                    return BadRequest(new
                    {
                        mensaje = "Faltan datos de la evidencia."
                    });
                }

                string uid = User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!;

                await _firebase.CorregirRegistroEvidencia(
                    uid, evidenciaId, nuevoRegistroId);

                return Ok(new
                {
                    mensaje = "Evidencia corregida correctamente."
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo corregir la evidencia."
                });
            }
        }

        // Eliminar evidencia de Cloudinary y Firestore
        [HttpDelete("evidencia/{evidenciaId}")]
        public async Task<IActionResult> EliminarEvidencia(
            string evidenciaId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(evidenciaId))
                    return BadRequest(new
                    {
                        mensaje = "Identificador de evidencia inválido."
                    });

                string uid = User.FindFirstValue(
                    ClaimTypes.NameIdentifier)!;

                var evidencia = await _firebase.ObtenerEvidencia(
                    uid, evidenciaId);

                if (evidencia == null)
                    return NotFound(new
                    {
                        mensaje = "No se encontró la evidencia."
                    });

                if (!evidencia.TryGetValue("url", out var valorUrl) ||
                    valorUrl is not string url ||
                    string.IsNullOrWhiteSpace(url))
                    return BadRequest(new
                    {
                        mensaje = "La evidencia no tiene una URL válida."
                    });

                await _cloudinary.EliminarEvidencia(url, uid);

                await _firebase.EliminarEvidencia(
                    uid, evidenciaId);

                return Ok(new
                {
                    mensaje = "Evidencia eliminada correctamente."
                });
            }
            catch (Exception)
            {
                return StatusCode(500, new
                {
                    mensaje = "No se pudo eliminar la evidencia."
                });
            }
        }
    }
}
