using PortalEvidencias.Aplicacion.DTOs.EstadisticasPublicas;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IVisitaEnlacePublicoService
{
    Task RegistrarVisualizacionAsync(
        int enlacePublicoId,
        string? identificadorVisitante);

    Task RegistrarMeGustaAsync(
        int enlacePublicoId,
        string identificadorVisitante);

    Task RegistrarDescargaCurriculumAsync(
        int enlacePublicoId,
        string? identificadorVisitante);

    Task<int> ObtenerVisualizacionesTotalesAsync(int enlacePublicoId);

    Task<int> ObtenerVisualizacionesSemanalesAsync(int enlacePublicoId);

    Task<int> ObtenerMeGustasAsync(int enlacePublicoId);

    Task<int> ObtenerDescargasCurriculumAsync(int enlacePublicoId);
    Task<EstadisticasEnlacePublicoDto> ObtenerEstadisticasAsync(int enlacePublicoId);
}