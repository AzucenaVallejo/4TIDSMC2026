using PortalEvidencias.Aplicacion.DTOs.Habilidades;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IHabilidadService
{
    Task<List<HabilidadResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);

    Task AgregarAlUsuarioAsync(
        int usuarioId,
        AsignarHabilidadRequestDto dto);

    Task ActualizarDeUsuarioAsync(
        int usuarioId,
        int habilidadId,
        ActualizarHabilidadRequestDto dto);

    Task EliminarDelUsuarioAsync(
        int usuarioId,
        int habilidadId);
}