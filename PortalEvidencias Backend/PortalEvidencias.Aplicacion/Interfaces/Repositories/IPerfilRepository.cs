
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IPerfilRepository
{
    Task<Perfil?> ObtenerPorIdAsync(int id);
    Task<Perfil?> ObtenerPorUsuarioIdAsync(int usuarioId);
    Task AgregarAsync(Perfil perfil);
    void Actualizar(Perfil perfil);
    Task GuardarCambiosAsync();
}
