
namespace PortalEvidencias.Aplicacion.DTOs.Auth;

public class RestablecerContrasenaDto
{
    public string TokenRestablecimiento { get; set; } = string.Empty;

    public string NuevaContrasena { get; set; } = string.Empty;

    public string ConfirmarContrasena { get; set; } = string.Empty;
}
