
namespace PortalEvidencias.Dominio.Entities;

public class Proyecto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Tecnologias { get; set; }
    public string? EnlaceRepositorio { get; set; }
    public string? EnlaceDemostracion { get; set; }

    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EsDestacado { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public ICollection<Documento> Documentos { get; set; }
    = new List<Documento>();
}
