
using PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;
using PortalEvidencias.Aplicacion.DTOs.Perfil;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface ICurriculumPdfService
{
    Task<byte[]> GenerarPdfAsync(
        CurriculumPublicoDto curriculum,
        FotografiaPerfilResponseDto? fotografia);
}
