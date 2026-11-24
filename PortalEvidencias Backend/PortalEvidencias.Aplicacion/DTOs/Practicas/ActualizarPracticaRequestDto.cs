
using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Practicas;

public class ActualizarPracticaRequestDto
{
    [Required, MaxLength(150)]
    public string Empresa { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Puesto { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? InstitucionEducativa { get; set; }

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EnCurso { get; set; }

    [Range(0, int.MaxValue)]
    public int? HorasRealizadas { get; set; }

    public int? DocumentoId { get; set; }
}
