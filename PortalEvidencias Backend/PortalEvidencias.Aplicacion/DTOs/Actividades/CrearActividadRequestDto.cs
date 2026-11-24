using System.ComponentModel.DataAnnotations;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.DTOs.Actividades;

public class CrearActividadRequestDto
{
    [Required, MaxLength(200)]
    public string Nombre { get; set; } = string.Empty;

    [EnumDataType(typeof(TipoActividadExtracurricular))]
    public TipoActividadExtracurricular Tipo { get; set; }

    [EnumDataType(typeof(ModalidadActividadExtracurricular))]
    public ModalidadActividadExtracurricular Modalidad { get; set; }

    [MaxLength(200)]
    public string? Organizacion { get; set; }

    [MaxLength(3000)]
    public string? Descripcion { get; set; }

    [EnumDataType(typeof(EstadoActividadExtracurricular))]
    public EstadoActividadExtracurricular Estado { get; set; }

    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }

    [Range(typeof(decimal), "0.01", "999999.99")]
    public decimal? Duracion { get; set; }

    [EnumDataType(typeof(UnidadDuracionActividad))]
    public UnidadDuracionActividad? UnidadDuracion { get; set; }

    public int? DocumentoId { get; set; }
}