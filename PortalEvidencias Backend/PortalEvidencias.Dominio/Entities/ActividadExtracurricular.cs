using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class ActividadExtracurricular
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public TipoActividadExtracurricular Tipo { get; set; }
    public ModalidadActividadExtracurricular Modalidad { get; set; }

    public string? Organizacion { get; set; }
    public string? Descripcion { get; set; }

    public EstadoActividadExtracurricular Estado { get; set; }

    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }

    public decimal? Duracion { get; set; }
    public UnidadDuracionActividad? UnidadDuracion { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public Documento? Documento { get; set; }
}