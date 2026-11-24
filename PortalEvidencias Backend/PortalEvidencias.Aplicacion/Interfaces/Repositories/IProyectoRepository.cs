
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IProyectoRepository
{
    Task<Proyecto?> ObtenerPorIdAsync(int id);
    Task<Proyecto?> ObtenerPorIdYUsuarioAsync(int id, int usuarioId);
    Task<List<Proyecto>> ObtenerPorUsuarioAsync(int usuarioId);
    Task<List<Proyecto>> ObtenerDestacadosPorUsuarioAsync(int usuarioId);
    Task AgregarAsync(Proyecto proyecto);
    void Actualizar(Proyecto proyecto);
    void Eliminar(Proyecto proyecto);
    Task GuardarCambiosAsync();
}
