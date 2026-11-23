using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IHabilidadRepository
{
    Task<Habilidad?> ObtenerPorIdAsync(int usuarioId, int habilidadId);

    Task<List<Habilidad>> ObtenerPorUsuarioAsync(int usuarioId);

    Task AgregarAsync(Habilidad habilidad);

    void Actualizar(Habilidad habilidad);

    void Eliminar(Habilidad habilidad);

    Task GuardarCambiosAsync();
}