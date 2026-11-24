namespace PortalEvidencias.Aplicacion.DTOs.Documentos;

public class DocumentoDescargaDto
{
    public string NombreArchivo { get; set; } = string.Empty;
    public string TipoContenido { get; set; } = string.Empty;
    public byte[] Contenido { get; set; } = [];
}