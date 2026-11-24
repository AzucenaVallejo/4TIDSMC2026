using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IReporteProblemaRepository
{
    Task<ReporteProblema?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId);

    Task<List<ReporteProblema>> ObtenerPorUsuarioAsync(int usuarioId);

    Task AgregarAsync(ReporteProblema reporte);

    Task GuardarCambiosAsync();
}