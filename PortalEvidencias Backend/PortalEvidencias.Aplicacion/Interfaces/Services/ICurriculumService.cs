using PortalEvidencias.Aplicacion.DTOs.Curriculum;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface ICurriculumService
{
    Task<List<CurriculumResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);

    Task<CurriculumResponseDto?> ObtenerPorIdAsync(int id, int usuarioId);

    Task<CurriculumResponseDto> CrearAsync(
        int usuarioId,
        CrearCurriculumRequestDto dto);

    Task<CurriculumResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarCurriculumRequestDto dto);

    Task<CurriculumResponseDto> ActualizarSeccionesAsync(
        int id,
        int usuarioId,
        ActualizarSeccionesRequestDto dto);

    Task CambiarPublicacionAsync(
        int id,
        int usuarioId,
        bool esPublico);

    Task EliminarAsync(int id, int usuarioId);

    Task<ConfiguracionCurriculumDto> ObtenerConfiguracionAsync(
    int usuarioId,
    int curriculumId);

    Task GuardarConfiguracionAsync(
        int usuarioId,
        int curriculumId,
        ConfiguracionCurriculumDto configuracion);
}