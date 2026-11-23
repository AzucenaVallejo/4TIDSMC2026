using PortalEvidencias.Aplicacion.DTOs.Intereses;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IInteresService
{
    Task<List<InteresResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);

    Task<InteresResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId);

    Task<InteresResponseDto> CrearAsync(
        int usuarioId,
        CrearInteresRequestDto dto);

    Task<InteresResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarInteresRequestDto dto);

    Task EliminarAsync(int id, int usuarioId);
}