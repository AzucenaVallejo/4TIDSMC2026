
namespace PortalEvidencias.Aplicacion.DTOs.Auth;

public class VerificarCodigoRecuperacionResponseDto
{
    public string TokenRestablecimiento { get; set; } = string.Empty;

    public DateTime FechaExpiracion { get; set; }
}
