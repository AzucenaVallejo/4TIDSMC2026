
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface ICurriculumRepository
{
    Task<Curriculum?> ObtenerPorIdAsync(int id);

    Task<Curriculum?> ObtenerPorIdYUsuarioAsync(
        int id,
        int usuarioId);

    Task<Curriculum?> ObtenerPorIdConSeccionesAsync(int id);

    Task<List<Curriculum>> ObtenerPorUsuarioAsync(int usuarioId);

    Task<Curriculum?> ObtenerPredeterminadoPorUsuarioAsync(
        int usuarioId);

    Task<Curriculum?> ObtenerPredeterminadoConSeccionesPorUsuarioAsync(
        int usuarioId);

    Task AgregarAsync(Curriculum curriculum);

    void Actualizar(Curriculum curriculum);

    void Eliminar(Curriculum curriculum);

    Task EliminarSeccionesAsync(int curriculumId);

    Task GuardarCambiosAsync();
}
