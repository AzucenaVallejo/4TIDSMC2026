using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IPreferenciaUsuarioRepository
{
    Task<PreferenciaUsuario?> ObtenerPorUsuarioAsync(int usuarioId);
    Task AgregarAsync(PreferenciaUsuario preferencia);
    void Actualizar(PreferenciaUsuario preferencia);
    void Eliminar(PreferenciaUsuario preferencia);
    Task GuardarCambiosAsync();
}