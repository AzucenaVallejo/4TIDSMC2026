
using PortalEvidencias.Aplicacion.DTOs.Documentos;
using PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;
using PortalEvidencias.Aplicacion.DTOs.Perfil;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IEnlacePublicoService
{
    Task<EnlacePublicoResponseDto> CrearAsync(
        int usuarioId,
        CrearEnlaceRequestDto dto);
    Task RegistrarMeGustaPorTokenAsync(
    string token,
    string identificadorVisitante);
    Task<List<EnlacePublicoResponseDto>> ObtenerPorUsuarioAsync(int usuarioId);
    Task<EnlacePublicoResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId);
    Task<DocumentoDescargaDto> ConsultarDocumentoPorTokenAsync(
    string token,
    int documentoId);
    Task<CurriculumPublicoDto> ConsultarPorTokenAsync(string token);
    Task<DocumentoDescargaDto?> DescargarCurriculumPorTokenAsync(
    string token,
    string identificadorVisitante);
    Task<string> ValidarCodigoAccesoAsync(string codigoAcceso);
    Task<FotografiaPerfilResponseDto?> ConsultarFotografiaPorTokenAsync(
    string token);
    Task RevocarAsync(int id, int usuarioId);
}
