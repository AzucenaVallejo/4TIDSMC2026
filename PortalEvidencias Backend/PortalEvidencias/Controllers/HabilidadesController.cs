using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Habilidades;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HabilidadesController : ControllerBase
{
    private readonly IHabilidadService _habilidadService;

    public HabilidadesController(IHabilidadService habilidadService)
    {
        _habilidadService = habilidadService;
    }

    [HttpGet("mis-habilidades")]
    public async Task<ActionResult<List<HabilidadResponseDto>>> ObtenerMisHabilidades()
    {
        try
        {
            int usuarioId = ObtenerUsuarioId();

            var habilidades =
                await _habilidadService.ObtenerPorUsuarioAsync(usuarioId);

            return Ok(habilidades);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    [HttpPost("mis-habilidades")]
    public async Task<IActionResult> AgregarHabilidad(
        [FromBody] AsignarHabilidadRequestDto dto)
    {
        try
        {
            int usuarioId = ObtenerUsuarioId();

            await _habilidadService.AgregarAlUsuarioAsync(usuarioId, dto);

            return Ok(new
            {
                mensaje = "La habilidad se registró correctamente."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    [HttpPut("mis-habilidades/{habilidadId:int}")]
    public async Task<IActionResult> ActualizarHabilidad(
        int habilidadId,
        [FromBody] ActualizarHabilidadRequestDto dto)
    {
        try
        {
            int usuarioId = ObtenerUsuarioId();

            await _habilidadService.ActualizarDeUsuarioAsync(
                usuarioId,
                habilidadId,
                dto);

            return Ok(new
            {
                mensaje = "La habilidad se actualizó correctamente."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("mis-habilidades/{habilidadId:int}")]
    public async Task<IActionResult> EliminarHabilidad(int habilidadId)
    {
        try
        {
            int usuarioId = ObtenerUsuarioId();

            await _habilidadService.EliminarDelUsuarioAsync(
                usuarioId,
                habilidadId);

            return Ok(new
            {
                mensaje = "La habilidad se eliminó correctamente."
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensaje = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { mensaje = ex.Message });
        }
    }

    private int ObtenerUsuarioId()
    {
        var identificador =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (!int.TryParse(identificador, out var usuarioId) ||
            usuarioId <= 0)
        {
            throw new UnauthorizedAccessException(
                "No se pudo identificar al usuario autenticado.");
        }

        return usuarioId;
    }
}