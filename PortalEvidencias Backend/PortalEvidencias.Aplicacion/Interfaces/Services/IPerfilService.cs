
using PortalEvidencias.Aplicacion.DTOs.Perfil;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IPerfilService
{
    Task<PerfilResponseDto?> ObtenerPorUsuarioAsync(int usuarioId);

    Task<PerfilResponseDto> ActualizarAsync(
        int usuarioId,
        ActualizarPerfilRequestDto dto);

    Task<PerfilResponseDto> ActualizarFotografiaAsync(
        int usuarioId,
        byte[] contenido);

    Task<FotografiaPerfilResponseDto?> ObtenerFotografiaAsync(
        int usuarioId);
}
