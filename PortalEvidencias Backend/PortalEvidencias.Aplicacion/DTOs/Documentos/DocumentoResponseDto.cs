using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.DTOs.Documentos;

public class DocumentoResponseDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public int? ProyectoId { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string TipoContenido { get; set; } = string.Empty;
    public TipoDocumento TipoDocumento { get; set; }
    public long TamanoBytes { get; set; }
    public DateTime FechaSubida { get; set; }
}