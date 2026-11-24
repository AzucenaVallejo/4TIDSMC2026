
using System.ComponentModel.DataAnnotations;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.DTOs.Experiencia;

public class ActualizarExperienciaRequestDto
{
    [Required]
    [MaxLength(150)]
    public string Empresa { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    public string Puesto { get; set; } = string.Empty;

    [Required]
    public TipoExperienciaLaboral Tipo { get; set; }

    [Required]
    public ModalidadExperienciaLaboral Modalidad { get; set; }

    [MaxLength(200)]
    public string? Ubicacion { get; set; }

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    public DateOnly FechaInicio { get; set; }

    public DateOnly? FechaFin { get; set; }

    public bool TrabajoActual { get; set; }

    public int? DocumentoId { get; set; }
}
