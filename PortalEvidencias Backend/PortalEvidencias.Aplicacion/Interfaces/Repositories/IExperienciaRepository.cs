
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IExperienciaRepository
{
    Task<ExperienciaLaboral?> ObtenerPorIdAsync(int id);

    Task<ExperienciaLaboral?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId);

    Task<List<ExperienciaLaboral>> ObtenerPorUsuarioAsync(
        int usuarioId);

    Task<Documento?> ObtenerDocumentoPorIdYUsuarioAsync(
        int documentoId,
        int usuarioId);

    Task<bool> DocumentoEstaVinculadoAsync(
        int documentoId,
        int experienciaActualId);

    Task AgregarAsync(ExperienciaLaboral experiencia);

    void Actualizar(ExperienciaLaboral experiencia);

    void Eliminar(ExperienciaLaboral experiencia);

    Task GuardarCambiosAsync();
}
