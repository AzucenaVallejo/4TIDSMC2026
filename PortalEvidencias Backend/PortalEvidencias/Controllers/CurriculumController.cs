
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Curriculum;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CurriculumController : ControllerBase
{
    private readonly ICurriculumService _service;

    public CurriculumController(ICurriculumService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerPorUsuario()
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        return Ok(await _service.ObtenerPorUsuarioAsync(usuarioId));
    }

    [HttpGet("config")]
    public async Task<IActionResult> ObtenerConfiguracion(
     [FromQuery] int curriculumId)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        if (curriculumId <= 0)
            return BadRequest("El ID del currículum no es válido.");

        var configuracion =
            await _service.ObtenerConfiguracionAsync(usuarioId, curriculumId);

        return Ok(configuracion);
    }

    

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        var resultado = await _service.ObtenerPorIdAsync(id, usuarioId);

        return resultado is null ? NotFound() : Ok(resultado);
    }

    [HttpPost]
    public async Task<IActionResult> Crear(
        [FromBody] CrearCurriculumRequestDto dto)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        var resultado = await _service.CrearAsync(usuarioId, dto);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = resultado.Id },
            resultado);
    }

    [HttpPut("config")]
    public async Task<IActionResult> GuardarConfiguracion(
        [FromQuery] int curriculumId,
        [FromBody] ConfiguracionCurriculumDto dto)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        if (curriculumId <= 0)
            return BadRequest("El ID del currículum no es válido.");

        await _service.GuardarConfiguracionAsync(
            usuarioId,
            curriculumId,
            dto);

        return NoContent();
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Actualizar(
        int id,
        [FromBody] ActualizarCurriculumRequestDto dto)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        return Ok(await _service.ActualizarAsync(id, usuarioId, dto));
    }
    [HttpPut("{id:int}/publicacion")]
    public async Task<IActionResult> CambiarPublicacion(
    int id,
    [FromBody] CambiarPublicacionCurriculumRequestDto dto)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        await _service.CambiarPublicacionAsync(
            id,
            usuarioId,
            dto.EsPublico);

        return NoContent();
    }

    [HttpPut("{id:int}/secciones")]
    public async Task<IActionResult> ActualizarSecciones(
        int id,
        [FromBody] ActualizarSeccionesRequestDto dto)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        return Ok(await _service.ActualizarSeccionesAsync(
            id, usuarioId, dto));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (!TryObtenerUsuarioId(out var usuarioId))
            return Unauthorized();

        await _service.EliminarAsync(id, usuarioId);

        return NoContent();
    }

    private bool TryObtenerUsuarioId(out int usuarioId)
    {
        usuarioId = 0;

        var valor = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(valor, out usuarioId) && usuarioId > 0;
    }
}
