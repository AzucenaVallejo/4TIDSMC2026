using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Curriculum;

public class ActualizarSeccionesRequestDto
{
    [Required]
    public List<SeccionCurriculumDto> Secciones { get; set; } = [];
}

public class SeccionCurriculumDto
{
    [Required, MaxLength(100)]
    public string TipoSeccion { get; set; } = string.Empty;

    public int Orden { get; set; }
    public bool Visible { get; set; } = true;
}