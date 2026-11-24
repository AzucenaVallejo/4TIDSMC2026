
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IInteresRepository
{
    Task<Interes?> ObtenerPorIdYUsuarioAsync(int id, int usuarioId);
    Task<List<Interes>> ObtenerPorUsuarioAsync(int usuarioId);
    Task AgregarAsync(Interes interes);
    void Actualizar(Interes interes);
    void Eliminar(Interes interes);
    Task GuardarCambiosAsync();
}
