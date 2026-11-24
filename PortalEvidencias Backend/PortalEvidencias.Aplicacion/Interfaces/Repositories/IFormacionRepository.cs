
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IFormacionRepository
{
    Task<FormacionAcademica?> ObtenerPorIdAsync(int id);
    Task<FormacionAcademica?> ObtenerPorIdYUsuarioAsync(int id, int usuarioId);
    Task<List<FormacionAcademica>> ObtenerPorUsuarioAsync(int usuarioId);
    Task<bool> ExisteDocumentoAsociadoAsync(int documentoId);
    Task AgregarAsync(FormacionAcademica formacion);
    void Actualizar(FormacionAcademica formacion);
    void Eliminar(FormacionAcademica formacion);
    Task GuardarCambiosAsync();
}
