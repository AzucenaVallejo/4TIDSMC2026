
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class Documento
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string NombreArchivo { get; set; } = string.Empty;
    public string TipoContenido { get; set; } = string.Empty;
    public long TamanoBytes { get; set; }

    public TipoDocumento TipoDocumento { get; set; }
    public EstadoDocumento Estado { get; set; } = EstadoDocumento.Activo;

    public byte[] Contenido { get; set; } = Array.Empty<byte>();

    public DateTime FechaCarga { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }

    public int? ActividadExtracurricularId { get; set; }
    public ActividadExtracurricular? ActividadExtracurricular { get; set; }

    public int? ExperienciaLaboralId { get; set; }
    public ExperienciaLaboral? ExperienciaLaboral { get; set; }
}
