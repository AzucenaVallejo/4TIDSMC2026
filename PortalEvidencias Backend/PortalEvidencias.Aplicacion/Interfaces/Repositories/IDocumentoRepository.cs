
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IDocumentoRepository
{
    Task<Documento?> ObtenerPorIdAsync(int id);
    Task<Documento?> ObtenerPorIdYUsuarioAsync(int id, int usuarioId);
    Task<List<Documento>> ObtenerPorUsuarioAsync(int usuarioId);
    Task<List<Documento>> ObtenerPorProyectoAsync(int proyectoId, int usuarioId);
    Task<List<Documento>> ObtenerPorTipoAsync(
        int usuarioId, TipoDocumento tipoDocumento);
    Task AgregarAsync(Documento documento);
    void Actualizar(Documento documento);
    void Eliminar(Documento documento);
    Task GuardarCambiosAsync();
}
