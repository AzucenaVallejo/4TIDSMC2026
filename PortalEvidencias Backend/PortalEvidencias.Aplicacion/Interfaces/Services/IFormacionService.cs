
using PortalEvidencias.Aplicacion.DTOs.Formacion;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IFormacionService
{
    Task<List<FormacionResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);
    Task<FormacionResponseDto?> ObtenerPorIdAsync(int id, int usuarioId);
    Task<FormacionResponseDto> CrearAsync(
        int usuarioId,
        CrearFormacionRequestDto dto);
    Task<FormacionResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarFormacionRequestDto dto);
    Task EliminarAsync(int id, int usuarioId);
}
