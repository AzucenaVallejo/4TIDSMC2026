namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class ExperienciaPublicaDto
{
    public int Id { get; set; }

    public string Empresa { get; set; } = string.Empty;

    public string Puesto { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty;

    public string Modalidad { get; set; } = string.Empty;

    public string? Ubicacion { get; set; }

    public string? Descripcion { get; set; }

    public DateOnly? FechaInicio { get; set; }

    public DateOnly? FechaFin { get; set; }

    public bool TrabajoActual { get; set; }

    public DocumentoPublicoDto? Documento { get; set; }
}