namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class PracticaPublicaDto
{
    public int Id { get; set; }

    public string Empresa { get; set; } = string.Empty;

    public string Puesto { get; set; } = string.Empty;

    public string? InstitucionEducativa { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public DateOnly? FechaInicio { get; set; }

    public DateOnly? FechaFin { get; set; }

    public bool EnCurso { get; set; }

    public int? HorasRealizadas { get; set; }

    public DocumentoPublicoDto? Documento { get; set; }
}