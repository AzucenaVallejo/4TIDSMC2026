
using PortalEvidencias.Aplicacion.DTOs.Usuarios;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IUsuarioService
{
    Task<UsuarioResponseDto?> ObtenerPorIdAsync(int usuarioId);
    Task<UsuarioResponseDto> ActualizarAsync(
        int usuarioId,
        ActualizarUsuarioRequestDto dto);
}
