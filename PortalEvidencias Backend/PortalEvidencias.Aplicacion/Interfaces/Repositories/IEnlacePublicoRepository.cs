using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IEnlacePublicoRepository
{
    Task<EnlacePublico?> ObtenerPorIdAsync(int id);

    Task<EnlacePublico?> ObtenerPorTokenAsync(string token);

    Task<EnlacePublico?> ObtenerPorCodigoAccesoAsync(string codigo);

    Task<List<EnlacePublico>> ObtenerPorUsuarioAsync(int usuarioId);

    Task AgregarAsync(EnlacePublico enlace);

    void Actualizar(EnlacePublico enlace);

    Task GuardarCambiosAsync();
}