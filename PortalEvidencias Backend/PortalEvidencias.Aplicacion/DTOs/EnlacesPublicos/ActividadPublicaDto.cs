namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class ActividadPublicaDto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string Tipo { get; set; } = string.Empty;

    public string Modalidad { get; set; } = string.Empty;

    public string? Organizacion { get; set; }

    public string? Descripcion { get; set; }

    public string Estado { get; set; } = string.Empty;

    public DateOnly? FechaInicio { get; set; }

    public DateOnly? FechaFin { get; set; }

    public decimal? Duracion { get; set; }

    public string? UnidadDuracion { get; set; }

    public DocumentoPublicoDto? Documento { get; set; }
}