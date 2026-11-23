
using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Auth;

public class RegistroRequestDto
{
    [Required, MaxLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string ApellidoPaterno { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string ApellidoMaterno { get; set; } = string.Empty;

    [Required, EmailAddress, MaxLength(256)]
    public string Correo { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(100)]
    public string Contrasena { get; set; } = string.Empty;

    [Required, Compare(nameof(Contrasena))]
    public string ConfirmarContrasena { get; set; } = string.Empty;
}
