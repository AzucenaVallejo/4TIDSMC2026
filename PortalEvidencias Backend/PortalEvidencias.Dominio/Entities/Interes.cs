namespace PortalEvidencias.Dominio.Entities;

public class Interes
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string? Icono { get; set; }

    public string Categoria { get; set; } = string.Empty;

    public string? CategoriaPersonalizada { get; set; }

    public string Tipo { get; set; } = string.Empty;

    public string Frecuencia { get; set; } = string.Empty;

    public bool IncludePublic { get; set; }

    public bool IncludeCV { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
}