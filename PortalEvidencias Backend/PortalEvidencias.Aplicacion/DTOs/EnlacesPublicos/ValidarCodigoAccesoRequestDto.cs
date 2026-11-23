using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class ValidarCodigoAccesoRequestDto
{
    [Required]
    [StringLength(10, MinimumLength = 10)]
    public string CodigoAcceso { get; set; } = string.Empty;
}