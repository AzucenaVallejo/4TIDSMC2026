namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class ProyectoPublicoDto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string? Tecnologias { get; set; }

    public string? UrlRepositorio { get; set; }

    public string? UrlDemostracion { get; set; }

    public DateOnly? FechaInicio { get; set; }

    public DateOnly? FechaFin { get; set; }

    public List<DocumentoPublicoDto> Documentos { get; set; } = [];
}