
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class ExperienciaLaboral
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Empresa { get; set; } = string.Empty;
    public string Puesto { get; set; } = string.Empty;

    public TipoExperienciaLaboral Tipo { get; set; }
    public ModalidadExperienciaLaboral Modalidad { get; set; }

    public string? Ubicacion { get; set; }
    public string? Descripcion { get; set; }

    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool TrabajoActual { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public Documento? Documento { get; set; }
}
