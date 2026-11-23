namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class InteresPublicoDto
{
    public int Id { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string? Icono { get; set; }

    public string Categoria { get; set; } = string.Empty;

    public string? CategoriaPersonalizada { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public string? Frecuencia { get; set; }
}