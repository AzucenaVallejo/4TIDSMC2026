
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Proyectos;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProyectosController : ControllerBase
{
    private readonly IProyectoService _proyectoService;

    public ProyectosController(IProyectoService proyectoService)
    {
        _proyectoService = proyectoService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProyectoResponseDto>>> ObtenerPorUsuario()
    {
        var usuarioId = ObtenerUsuarioId();

        var proyectos = await _proyectoService
            .ObtenerPorUsuarioAsync(usuarioId);

        return Ok(proyectos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ProyectoResponseDto>> ObtenerPorId(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        var proyecto = await _proyectoService
            .ObtenerPorIdAsync(id, usuarioId);

        if (proyecto is null)
        {
            return NotFound(new
            {
                mensaje = "No se encontró el proyecto solicitado."
            });
        }

        return Ok(proyecto);
    }

    [HttpGet("destacados")]
    public async Task<ActionResult<List<ProyectoResponseDto>>> ObtenerDestacados()
    {
        var usuarioId = ObtenerUsuarioId();

        var proyectos = await _proyectoService
            .ObtenerDestacadosAsync(usuarioId);

        return Ok(proyectos);
    }

    [HttpPost]
    public async Task<ActionResult<ProyectoResponseDto>> Crear(
        [FromBody] CrearProyectoRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var proyecto = await _proyectoService
            .CrearAsync(usuarioId, dto);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = proyecto.Id },
            proyecto);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProyectoResponseDto>> Actualizar(
        int id,
        [FromBody] ActualizarProyectoRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var proyecto = await _proyectoService
            .ActualizarAsync(id, usuarioId, dto);

        return Ok(proyecto);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var usuarioId = ObtenerUsuarioId();

        await _proyectoService.EliminarAsync(id, usuarioId);

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
