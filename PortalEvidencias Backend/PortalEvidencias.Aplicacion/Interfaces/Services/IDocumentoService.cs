using PortalEvidencias.Aplicacion.DTOs.Documentos;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IDocumentoService
{
    Task<DocumentoResponseDto?> ObtenerPorIdAsync(
        int documentoId,
        int usuarioId);

    Task<List<DocumentoResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId);

    Task<List<DocumentoResponseDto>> ObtenerPorProyectoAsync(
        int proyectoId,
        int usuarioId);

    Task<DocumentoResponseDto> SubirAsync(
        int usuarioId,
        string nombreArchivo,
        string tipoContenido,
        byte[] contenido,
        TipoDocumento tipoDocumento,
        int? proyectoId = null);

    Task<DocumentoDescargaDto> DescargarAsync(
        int documentoId,
        int usuarioId);

    Task EliminarAsync(int documentoId, int usuarioId);
}