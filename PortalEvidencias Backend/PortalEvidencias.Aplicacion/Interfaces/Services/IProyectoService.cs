
using PortalEvidencias.Aplicacion.DTOs.Proyectos;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IProyectoService
{
    Task<List<ProyectoResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);
    Task<ProyectoResponseDto?> ObtenerPorIdAsync(int id, int usuarioId);
    Task<List<ProyectoResponseDto>> ObtenerDestacadosAsync(int usuarioId);
    Task<ProyectoResponseDto> CrearAsync(
        int usuarioId,
        CrearProyectoRequestDto dto);
    Task<ProyectoResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarProyectoRequestDto dto);
    Task EliminarAsync(int id, int usuarioId);
}
