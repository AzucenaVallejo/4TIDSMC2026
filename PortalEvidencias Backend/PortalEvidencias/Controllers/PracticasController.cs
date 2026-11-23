
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Practicas;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PracticasController : ControllerBase
{
    private readonly IPracticaService _practicaService;

    public PracticasController(IPracticaService practicaService)
    {
        _practicaService = practicaService;
    }

    [HttpGet]
    public async Task<ActionResult<List<PracticaResponseDto>>> ObtenerPorUsuario()
    {
        var usuarioId = ObtenerUsuarioId();

        var practicas = await _practicaService
            .ObtenerPorUsuarioAsync(usuarioId);

        return Ok(practicas);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PracticaResponseDto>> ObtenerPorId(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        var practica = await _practicaService
            .ObtenerPorIdAsync(id, usuarioId);

        if (practica is null)
        {
            return NotFound(new
            {
                mensaje = "No se encontró la práctica profesional solicitada."
            });
        }

        return Ok(practica);
    }

    [HttpPost]
    public async Task<ActionResult<PracticaResponseDto>> Crear(
        [FromBody] CrearPracticaRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var practica = await _practicaService
            .CrearAsync(usuarioId, dto);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = practica.Id },
            practica);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PracticaResponseDto>> Actualizar(
        int id,
        [FromBody] ActualizarPracticaRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var practica = await _practicaService
            .ActualizarAsync(id, usuarioId, dto);

        return Ok(practica);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        await _practicaService.EliminarAsync(id, usuarioId);

        return NoContent();
    }

    private int ObtenerUsuarioId()
    {
        var identificador =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!int.TryParse(identificador, out var usuarioId) ||
            usuarioId <= 0)
        {
            throw new UnauthorizedAccessException(
                "No se pudo identificar al usuario autenticado.");
        }

        return usuarioId;
    }
}
