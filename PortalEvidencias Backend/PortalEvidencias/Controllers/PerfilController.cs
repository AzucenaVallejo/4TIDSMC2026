
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Perfil;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PerfilController : ControllerBase
{
    private readonly IPerfilService _perfilService;

    public PerfilController(IPerfilService perfilService)
    {
        _perfilService = perfilService;
    }

    /// <summary>
    /// Obtiene el perfil del usuario autenticado.
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(PerfilResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PerfilResponseDto>> ObtenerMiPerfil()
    {
        int usuarioId = ObtenerUsuarioId();

        var perfil = await _perfilService.ObtenerPorUsuarioAsync(usuarioId);

        if (perfil is null)
        {
            return NotFound(new
            {
                mensaje = "No se encontró el perfil del usuario autenticado."
            });
        }

        AgregarRutaFotografia(perfil);

        return Ok(perfil);
    }

    /// <summary>
    /// Actualiza los datos del perfil sin modificar la fotografía.
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(PerfilResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PerfilResponseDto>> ActualizarMiPerfil(
        [FromBody] ActualizarPerfilRequestDto dto)
    {
        int usuarioId = ObtenerUsuarioId();

        var perfil = await _perfilService.ActualizarAsync(usuarioId, dto);

        AgregarRutaFotografia(perfil);

        return Ok(perfil);
    }

    /// <summary>
    /// Carga o reemplaza la fotografía del usuario autenticado.
    /// </summary>
    [HttpPost("me/fotografia")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(PerfilResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PerfilResponseDto>> ActualizarMiFotografia(
        [FromForm] IFormFile? archivo)
    {
        if (archivo is null || archivo.Length == 0)
        {
            return BadRequest(new
            {
                mensaje = "Debes seleccionar una fotografía."
            });
        }

        const long tamanoMaximo = 5 * 1024 * 1024;

        if (archivo.Length > tamanoMaximo)
        {
            return BadRequest(new
            {
                mensaje = "La fotografía no puede superar los 5 MB."
            });
        }

        int usuarioId = ObtenerUsuarioId();

        await using var memoria = new MemoryStream();

        await archivo.CopyToAsync(memoria);

        var perfil = await _perfilService.ActualizarFotografiaAsync(
            usuarioId,
            memoria.ToArray());

        AgregarRutaFotografia(perfil);

        return Ok(perfil);
    }

    /// <summary>
    /// Devuelve la fotografía del usuario autenticado.
    /// </summary>
    [HttpGet("me/fotografia")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ObtenerMiFotografia()
    {
        int usuarioId = ObtenerUsuarioId();

        var fotografia = await _perfilService.ObtenerFotografiaAsync(usuarioId);

        if (fotografia is null)
        {
            return NotFound(new
            {
                mensaje = "No se encontró una fotografía de perfil."
            });
        }

        return File(
            fotografia.Contenido,
            fotografia.TipoContenido);
    }

    private void AgregarRutaFotografia(PerfilResponseDto perfil)
    {
        perfil.RutaFotografia = Url.ActionLink(
            nameof(ObtenerMiFotografia),
            "Perfil");
    }

    private int ObtenerUsuarioId()
    {
        var identificador = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(identificador, out int usuarioId) ||
            usuarioId <= 0)
        {
            throw new UnauthorizedAccessException(
                "El token no contiene un identificador de usuario válido.");
        }

        return usuarioId;
    }
}
