
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Experiencia;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExperienciaController : ControllerBase
{
    private readonly IExperienciaService _experienciaService;

    public ExperienciaController(
        IExperienciaService experienciaService)
    {
        _experienciaService = experienciaService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ExperienciaResponseDto>>>
        ObtenerPorUsuario()
    {
        var usuarioId = ObtenerUsuarioId();

        var experiencias =
            await _experienciaService.ObtenerPorUsuarioAsync(usuarioId);

        return Ok(experiencias);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ExperienciaResponseDto>>
        ObtenerPorId(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        var experiencia =
            await _experienciaService.ObtenerPorIdAsync(id, usuarioId);

        return Ok(experiencia);
    }

    [HttpPost]
    public async Task<ActionResult<ExperienciaResponseDto>> Crear(
        [FromBody] CrearExperienciaRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var experiencia =
            await _experienciaService.CrearAsync(dto, usuarioId);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = experiencia.Id },
            experiencia);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ExperienciaResponseDto>> Actualizar(
        int id,
        [FromBody] ActualizarExperienciaRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var experiencia =
            await _experienciaService.ActualizarAsync(
                id,
                dto,
                usuarioId);

        return Ok(experiencia);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        await _experienciaService.EliminarAsync(id, usuarioId);

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
