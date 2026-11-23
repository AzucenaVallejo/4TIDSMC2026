using PortalEvidencias.Aplicacion.DTOs.Preferencias;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IPreferenciaUsuarioService
{
    Task<PreferenciasResponseDto> ObtenerAsync(int usuarioId);

    Task<PreferenciasResponseDto> ActualizarAsync(
        int usuarioId,
        ActualizarPreferenciasRequestDto dto);

    Task<PreferenciasResponseDto> RestablecerAsync(int usuarioId);
}