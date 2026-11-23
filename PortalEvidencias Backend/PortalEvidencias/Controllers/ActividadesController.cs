using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Actividades;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActividadController : ControllerBase
{
    private readonly IActividadService _actividadService;

    public ActividadController(IActividadService actividadService)
    {
        _actividadService = actividadService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ActividadResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<ActividadResponseDto>>> ObtenerPorUsuario()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var actividades =
            await _actividadService.ObtenerPorUsuarioAsync(usuarioId);

        return Ok(actividades);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ActividadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ActividadResponseDto>> ObtenerPorId(int id)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var actividad =
            await _actividadService.ObtenerPorIdAsync(id, usuarioId);

        if (actividad is null)
            return NotFound();

        return Ok(actividad);
    }

    [HttpPost]
    [ProducesResponseType(typeof(ActividadResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ActividadResponseDto>> Crear(
        [FromBody] CrearActividadRequestDto dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var actividad =
            await _actividadService.CrearAsync(usuarioId, dto);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = actividad.Id },
            actividad);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ActividadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ActividadResponseDto>> Actualizar(
        int id,
        [FromBody] ActualizarActividadRequestDto dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var actividad =
            await _actividadService.ActualizarAsync(id, usuarioId, dto);

        return Ok(actividad);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        await _actividadService.EliminarAsync(id, usuarioId);

        return NoContent();
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