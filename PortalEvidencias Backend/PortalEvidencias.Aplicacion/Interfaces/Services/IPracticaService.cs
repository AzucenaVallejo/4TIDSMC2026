
using PortalEvidencias.Aplicacion.DTOs.Practicas;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IPracticaService
{
    Task<List<PracticaResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);

    Task<PracticaResponseDto?> ObtenerPorIdAsync(int id, int usuarioId);

    Task<PracticaResponseDto> CrearAsync(
        int usuarioId,
        CrearPracticaRequestDto dto);

    Task<PracticaResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarPracticaRequestDto dto);

    Task<bool> ExisteDocumentoAsociadoAsync(int documentoId);

    Task EliminarAsync(int id, int usuarioId);
}
