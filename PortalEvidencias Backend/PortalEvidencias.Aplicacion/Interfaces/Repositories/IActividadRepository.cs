using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IActividadRepository
{
    Task<ActividadExtracurricular?> ObtenerPorIdAsync(int id);

    Task<ActividadExtracurricular?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId);

    Task<List<ActividadExtracurricular>> ObtenerPorUsuarioAsync(
        int usuarioId);

    Task<Documento?> ObtenerDocumentoPorIdYUsuarioAsync(
        int documentoId,
        int usuarioId);

    Task<bool> ExisteDocumentoAsync(
        int documentoId,
        int usuarioId);

    Task<bool> DocumentoEstaVinculadoAsync(
     int documentoId,
     int? actividadActualId = null,
     int? proyectoActualId = null);

    Task AgregarAsync(ActividadExtracurricular actividad);

    void Actualizar(ActividadExtracurricular actividad);

    void Eliminar(ActividadExtracurricular actividad);

    Task GuardarCambiosAsync();
}