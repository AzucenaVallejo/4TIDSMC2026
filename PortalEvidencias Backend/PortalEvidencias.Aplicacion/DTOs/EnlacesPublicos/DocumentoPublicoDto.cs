namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class DocumentoPublicoDto
{
    public int Id { get; set; }

    public string NombreArchivo { get; set; } = string.Empty;

    public string TipoContenido { get; set; } = string.Empty;

    public long TamanoBytes { get; set; }

    public string UrlVisualizacion { get; set; } = string.Empty;
}