
using PortalEvidencias.Aplicacion.DTOs.Experiencia;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IExperienciaService
{
    Task<List<ExperienciaResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);

    Task<ExperienciaResponseDto> ObtenerPorIdAsync(
        int id,
        int usuarioId);

    Task<ExperienciaResponseDto> CrearAsync(
        CrearExperienciaRequestDto dto,
        int usuarioId);

    Task<ExperienciaResponseDto> ActualizarAsync(
        int id,
        ActualizarExperienciaRequestDto dto,
        int usuarioId);

    Task EliminarAsync(int id, int usuarioId);
}
