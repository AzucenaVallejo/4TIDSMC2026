using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Formacion;

public class ActualizarFormacionRequestDto
{
    [Required, MaxLength(150)]
    public string Institucion { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string NivelEducativo { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Carrera { get; set; }

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EnCurso { get; set; }

    public int? DocumentoCertificadoId { get; set; }
    public int? DocumentoTituloId { get; set; }

}