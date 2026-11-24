
using Microsoft.AspNetCore.Mvc;
using PortafolioDeEvidencias.Services;

namespace PortafolioDeEvidencias.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FirebaseController : ControllerBase
    {
        private readonly FirebaseService _firebase;

        public FirebaseController(FirebaseService firebase)
        {
            _firebase = firebase;
        }

        [HttpGet("probar")]
        public async Task<IActionResult> Probar()
        {
            try
            {
                await _firebase.ProbarConexion();
                return Ok("¡Conexión con Firebase y Firestore exitosa!");
            }
            catch (Exception ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
