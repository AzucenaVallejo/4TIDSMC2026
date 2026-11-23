
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;
using PortalEvidencias.Aplicacion.DTOs.EstadisticasPublicas;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using System.Security.Cryptography;
using System.Text;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EnlacesPublicosController : ControllerBase
{
    private readonly IEnlacePublicoService _service;
    private readonly IVisitaEnlacePublicoService _visitaService;

    public EnlacesPublicosController(
        IEnlacePublicoService service,
        IVisitaEnlacePublicoService visitaService)
    {
        _service = service;
        _visitaService = visitaService;
    }

    [HttpPost]
    public async Task<ActionResult<EnlacePublicoResponseDto>> Crear(
        [FromBody] CrearEnlaceRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var resultado = await _service.CrearAsync(usuarioId, dto);

        return Created(resultado.UrlPublica, resultado);
    }
    private const string CookieVisitante = "PortalEvidencias.Visitante";

    private string ObtenerIdentificadorVisitante()
    {
        if (!Request.Cookies.TryGetValue(CookieVisitante, out var identificador)
            || string.IsNullOrWhiteSpace(identificador))
        {
            identificador = Convert.ToHexString(
                RandomNumberGenerator.GetBytes(32));

            Response.Cookies.Append(
                CookieVisitante,
                identificador,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Lax,
                    IsEssential = true,
                    Expires = DateTimeOffset.UtcNow.AddYears(1),
                    Path = "/"
                });
        }

        return Convert.ToHexString(
            SHA256.HashData(Encoding.UTF8.GetBytes(identificador)));
    }

    [AllowAnonymous]
    [HttpPost("publico/{token}/me-gusta")]
    public async Task<IActionResult> RegistrarMeGusta(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest();

        var identificadorVisitante = ObtenerIdentificadorVisitante();

        await _service.RegistrarMeGustaPorTokenAsync(
            token,
            identificadorVisitante);

        return Ok(new { mensaje = "Me gusta registrado correctamente." });
    }
    [HttpGet]
    public async Task<ActionResult<List<EnlacePublicoResponseDto>>> ObtenerPorUsuario()
    {
        var usuarioId = ObtenerUsuarioId();

        var resultado = await _service.ObtenerPorUsuarioAsync(usuarioId);

        return Ok(resultado);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EnlacePublicoResponseDto>> ObtenerPorId(
        int id)
    {
        var usuarioId = ObtenerUsuarioId();

        var resultado = await _service.ObtenerPorIdAsync(id, usuarioId);

        if (resultado is null)
            return NotFound();

        return Ok(resultado);
    }

    [HttpGet("{id:int}/estadisticas")]
    public async Task<ActionResult<EstadisticasEnlacePublicoDto>> ObtenerEstadisticas(
        int id)
    {
        var usuarioId = ObtenerUsuarioId();

        var enlace = await _service.ObtenerPorIdAsync(id, usuarioId);

        if (enlace is null)
            return NotFound();

        var estadisticas = await _visitaService.ObtenerEstadisticasAsync(id);

        return Ok(estadisticas);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Revocar(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        await _service.RevocarAsync(id, usuarioId);

        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("publico/validar-codigo")]
    public async Task<IActionResult> ValidarCodigoAcceso(
    [FromBody] ValidarCodigoAccesoRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.CodigoAcceso))
            return BadRequest(new
            {
                mensaje = "Debes introducir un código de acceso."
            });

        try
        {
            var token = await _service.ValidarCodigoAccesoAsync(
                dto.CodigoAcceso);

            return Ok(new
            {
                token,
                urlPublica = $"/public_profile.html?token={Uri.EscapeDataString(token)}"
            });
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new
            {
                mensaje = "El código de acceso no es válido, ha expirado o fue revocado."
            });
        }
        catch (InvalidOperationException)
        {
            return NotFound(new
            {
                mensaje = "El currículum asociado a este código ya no está disponible."
            });
        }
    }

    [AllowAnonymous]
    [HttpGet("publico/{token}")]
    public async Task<ActionResult<CurriculumPublicoDto>> ConsultarPublico(
    string token)
    {
        var resultado = await _service.ConsultarPorTokenAsync(token);

        return Ok(resultado);
    }
    [AllowAnonymous]
    [HttpGet("publico/{token}/fotografia")]
    public async Task<IActionResult> ConsultarFotografiaPublica(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest();

        var fotografia = await _service.ConsultarFotografiaPorTokenAsync(token);

        if (fotografia is null)
            return NotFound();

        return File(
            fotografia.Contenido,
            fotografia.TipoContenido);
    }

    [AllowAnonymous]
    [HttpGet("publico/{token}/documentos/{documentoId:int}")]
    public async Task<IActionResult> VisualizarDocumentoPublico(
        string token,
        int documentoId)
    {
        var documento = await _service.ConsultarDocumentoPorTokenAsync(
            token,
            documentoId);

        return File(
            documento.Contenido,
            documento.TipoContenido);
    }
    [AllowAnonymous]
    [HttpGet("publico/{token}/descargar")]
    public async Task<IActionResult> DescargarCurriculumPublico(
    string token)
    {
        var identificadorVisitante = ObtenerIdentificadorVisitante();

        var archivo = await _service.DescargarCurriculumPorTokenAsync(
            token,
            identificadorVisitante);

        if (archivo is null)
            return Forbid();

        return File(
            archivo.Contenido,
            archivo.TipoContenido,
            archivo.NombreArchivo);
    }
    private int ObtenerUsuarioId()
    {
        var valor = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(valor, out var usuarioId) || usuarioId <= 0)
        {
            throw new UnauthorizedAccessException(
                "No se pudo identificar al usuario autenticado.");
        }

        return usuarioId;
    }
}
