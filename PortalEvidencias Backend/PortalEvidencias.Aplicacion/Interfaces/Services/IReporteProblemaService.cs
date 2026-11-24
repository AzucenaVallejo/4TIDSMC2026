using PortalEvidencias.Aplicacion.DTOs.Reportes;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IReporteProblemaService
{
    Task<ReporteResponseDto> CrearAsync(
        int usuarioId,
        CrearReporteRequestDto dto);

    Task<List<ReporteResponseDto>> ObtenerMisReportesAsync(
        int usuarioId);
}