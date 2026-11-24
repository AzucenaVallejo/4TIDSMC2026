
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Formacion;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FormacionController : ControllerBase
{
    private readonly IFormacionService _formacionService;

    public FormacionController(IFormacionService formacionService)
    {
        _formacionService = formacionService;
    }

    [HttpGet]
    public async Task<ActionResult<List<FormacionResponseDto>>> ObtenerPorUsuario()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var formaciones =
            await _formacionService.ObtenerPorUsuarioAsync(usuarioId);

        return Ok(formaciones);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<FormacionResponseDto>> ObtenerPorId(int id)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var formacion =
            await _formacionService.ObtenerPorIdAsync(id, usuarioId);

        if (formacion is null)
            return NotFound();

        return Ok(formacion);
    }

    [HttpPost]
    public async Task<ActionResult<FormacionResponseDto>> Crear(
        [FromBody] CrearFormacionRequestDto dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var formacion =
            await _formacionService.CrearAsync(usuarioId, dto);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { id = formacion.Id },
            formacion);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<FormacionResponseDto>> Actualizar(
        int id,
        [FromBody] ActualizarFormacionRequestDto dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var formacion =
            await _formacionService.ActualizarAsync(id, usuarioId, dto);

        return Ok(formacion);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        await _formacionService.EliminarAsync(id, usuarioId);

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
