using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Auth;

public class GoogleLoginRequestDto
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}