using PortalEvidencias.Aplicacion.DTOs.Reportes;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Validators;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Services;

public class ReporteProblemaService : IReporteProblemaService
{
    private readonly IReporteProblemaRepository _repository;

    public ReporteProblemaService(
        IReporteProblemaRepository repository)
    {
        _repository = repository;
    }

    public async Task<ReporteResponseDto> CrearAsync(
        int usuarioId,
        CrearReporteRequestDto dto)
    {
        ReporteProblemaValidator.ValidarUsuarioId(usuarioId);
        ReporteProblemaValidator.Validar(dto);

        var reporte = new ReporteProblema
        {
            UsuarioId = usuarioId,
            Tipo = dto.Tipo.Trim().ToLowerInvariant(),
            Asunto = dto.Asunto.Trim(),
            Descripcion = dto.Descripcion.Trim(),
            FechaCreacion = DateTime.UtcNow
        };

        await _repository.AgregarAsync(reporte);
        await _repository.GuardarCambiosAsync();

        return MapearRespuesta(reporte);
    }

    public async Task<List<ReporteResponseDto>> ObtenerMisReportesAsync(
        int usuarioId)
    {
        ReporteProblemaValidator.ValidarUsuarioId(usuarioId);

        var reportes = await _repository.ObtenerPorUsuarioAsync(usuarioId);

        return reportes.Select(MapearRespuesta).ToList();
    }

    private static ReporteResponseDto MapearRespuesta(
        ReporteProblema reporte)
    {
        return new ReporteResponseDto
        {
            Id = reporte.Id,
            Tipo = reporte.Tipo,
            Asunto = reporte.Asunto,
            Descripcion = reporte.Descripcion,
            Estado = reporte.Estado.ToString(),
            FechaCreacion = reporte.FechaCreacion,
            FechaActualizacion = reporte.FechaActualizacion
        };
    }
}