using PortalEvidencias.Aplicacion.DTOs.Privacidad;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IConfiguracionPrivacidadService
{
    Task<ConfiguracionPrivacidadDto> ObtenerAsync(int usuarioId);

    Task<ConfiguracionPrivacidadDto> ActualizarAsync(
        int usuarioId,
        ActualizarPrivacidadRequestDto dto);

    Task<bool> DocumentoEstaAutorizadoAsync(
        int usuarioId,
        int documentoId);
}