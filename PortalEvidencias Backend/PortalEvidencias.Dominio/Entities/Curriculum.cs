
namespace PortalEvidencias.Dominio.Entities;

public class Curriculum
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public bool EsPredeterminado { get; set; }
    public bool EsPublico { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public ICollection<CurriculumSeccion> Secciones { get; set; }
        = new List<CurriculumSeccion>();
}
