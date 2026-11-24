using PortalEvidencias.Aplicacion.DTOs.Actividades;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IActividadService
{
    Task<List<ActividadResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);

    Task<ActividadResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId);

    Task<ActividadResponseDto> CrearAsync(
        int usuarioId,
        CrearActividadRequestDto dto);

    Task<ActividadResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarActividadRequestDto dto);

    Task EliminarAsync(int id, int usuarioId);
}