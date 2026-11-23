using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Curriculum;

public class CrearCurriculumRequestDto
{
    [Required, MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    public bool EsPredeterminado { get; set; }
}