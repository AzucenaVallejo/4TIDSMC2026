using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IConfiguracionPrivacidadRepository
{
    Task<ConfiguracionPrivacidad?> ObtenerPorUsuarioAsync(int usuarioId);

    Task AgregarAsync(ConfiguracionPrivacidad configuracion);

    void Actualizar(ConfiguracionPrivacidad configuracion);

    Task GuardarCambiosAsync();
}