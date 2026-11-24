using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Curriculum;

public class ActualizarCurriculumRequestDto
{
    [Required, MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    public bool EsPredeterminado { get; set; }
}