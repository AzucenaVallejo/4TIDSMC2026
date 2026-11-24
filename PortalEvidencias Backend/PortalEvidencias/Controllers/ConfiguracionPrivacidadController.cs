using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Privacidad;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ConfiguracionPrivacidadController : ControllerBase
{
    private readonly IConfiguracionPrivacidadService _service;

    public ConfiguracionPrivacidadController(
        IConfiguracionPrivacidadService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ConfiguracionPrivacidadDto>> Obtener()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var configuracion = await _service.ObtenerAsync(usuarioId);

        return Ok(configuracion);
    }

    [HttpPut]
    public async Task<ActionResult<ConfiguracionPrivacidadDto>> Actualizar(
        [FromBody] ActualizarPrivacidadRequestDto dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        if (dto is null)
            return BadRequest();

        try
        {
            var configuracion = await _service.ActualizarAsync(
                usuarioId,
                dto);

            return Ok(configuracion);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
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