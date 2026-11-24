
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Intereses;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InteresesController : ControllerBase
{
    private readonly IInteresService _interesService;

    public InteresesController(IInteresService interesService)
    {
        _interesService = interesService;
    }

    [HttpGet]
    public async Task<ActionResult<List<InteresResponseDto>>>
        ObtenerPorUsuario()
    {
        var usuarioId = ObtenerUsuarioId();

        var intereses =
            await _interesService.ObtenerPorUsuarioAsync(usuarioId);

        return Ok(intereses);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<InteresResponseDto>> ObtenerPorId(
        int id)
    {
        var usuarioId = ObtenerUsuarioId();

        var interes =
            await _interesService.ObtenerPorIdAsync(id, usuarioId);

        if (interes is null)
        {
            return NotFound(new
            {
                mensaje = "No se encontró el interés solicitado."
            });
        }

        return Ok(interes);
    }

    [HttpPost]
    public async Task<ActionResult<InteresResponseDto>> Crear(
        [FromBody] CrearInteresRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var interes = await _interesService.CrearAsync(usuarioId, dto);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = interes.Id },
            interes);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<InteresResponseDto>> Actualizar(
        int id,
        [FromBody] ActualizarInteresRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var interes =
            await _interesService.ActualizarAsync(id, usuarioId, dto);

        return Ok(interes);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        await _interesService.EliminarAsync(id, usuarioId);

        return NoContent();
    }

    private int ObtenerUsuarioId()
    {
        var identificador =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!int.TryParse(identificador, out var usuarioId)
            || usuarioId <= 0)
        {
            throw new UnauthorizedAccessException(
                "No se pudo identificar al usuario autenticado.");
        }

        return usuarioId;
    }
}
