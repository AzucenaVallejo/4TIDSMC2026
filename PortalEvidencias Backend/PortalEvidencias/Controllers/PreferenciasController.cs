using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Preferencias;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PreferenciasController : ControllerBase
{
    private readonly IPreferenciaUsuarioService _service;

    public PreferenciasController(IPreferenciaUsuarioService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<PreferenciasResponseDto>> Obtener()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var preferencias = await _service.ObtenerAsync(usuarioId);

        return Ok(preferencias);
    }

    [HttpPut]
    public async Task<ActionResult<PreferenciasResponseDto>> Actualizar(
        [FromBody] ActualizarPreferenciasRequestDto dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var preferencias = await _service.ActualizarAsync(
            usuarioId,
            dto);

        return Ok(preferencias);
    }

    [HttpPost("restablecer")]
    public async Task<ActionResult<PreferenciasResponseDto>> Restablecer()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var preferencias = await _service.RestablecerAsync(usuarioId);

        return Ok(preferencias);
    }

    private bool IntentarObtenerUsuarioId(out int usuarioId)
    {
        var identificador =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return int.TryParse(identificador, out usuarioId)
            && usuarioId > 0;
    }
}