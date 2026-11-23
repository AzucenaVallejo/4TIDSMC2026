using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class CrearEnlaceRequestDto
{
    [Required]
    public int CurriculumId { get; set; }

    public DateTime? FechaExpiracion { get; set; }

    public bool PermitirDescarga { get; set; }
}