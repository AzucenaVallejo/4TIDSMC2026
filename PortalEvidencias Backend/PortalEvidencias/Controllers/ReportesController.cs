using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Reportes;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportesController : ControllerBase
{
    private readonly IReporteProblemaService _service;

    public ReportesController(IReporteProblemaService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<ActionResult<ReporteResponseDto>> Crear(
        [FromBody] CrearReporteRequestDto dto)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var reporte = await _service.CrearAsync(usuarioId, dto);

        return StatusCode(
            StatusCodes.Status201Created,
            reporte);
    }

    [HttpGet("mis-reportes")]
    public async Task<ActionResult<List<ReporteResponseDto>>> ObtenerMisReportes()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var reportes = await _service.ObtenerMisReportesAsync(usuarioId);

        return Ok(reportes);
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