
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IUsuarioRepository
{
    Task<Usuario?> ObtenerPorIdAsync(int id);
    Task<Usuario?> ObtenerPorCorreoAsync(string correo);
    Task<bool> ExisteCorreoAsync(string correo); 
    Task AgregarAsync(Usuario usuario);
    Task GuardarCambiosAsync();
}
