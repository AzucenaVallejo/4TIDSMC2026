
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface ISolicitudRecuperacionContrasenaRepository
{
    Task<SolicitudRecuperacionContrasena?> ObtenerPorIdAsync(int id);

    Task<SolicitudRecuperacionContrasena?> ObtenerUltimaPorUsuarioAsync(int usuarioId);

    Task<SolicitudRecuperacionContrasena?> ObtenerPorTokenHashAsync(string tokenHash);

    Task AgregarAsync(SolicitudRecuperacionContrasena solicitud);

    void Actualizar(SolicitudRecuperacionContrasena solicitud);

    Task GuardarCambiosAsync();
}
