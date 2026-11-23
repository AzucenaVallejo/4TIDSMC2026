namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class HabilidadPublicaDto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string Categoria { get; set; } = string.Empty;

    public string Nivel { get; set; } = string.Empty;

    public string? Experiencia { get; set; }
}