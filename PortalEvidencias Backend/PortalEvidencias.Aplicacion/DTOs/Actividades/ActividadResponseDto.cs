using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.DTOs.Actividades;

public class ActividadResponseDto
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

    public int? DocumentoId { get; set; }
    public string? NombreDocumento { get; set; }
    public string? TipoContenidoDocumento { get; set; }
    public long? TamanoDocumento { get; set; }
}