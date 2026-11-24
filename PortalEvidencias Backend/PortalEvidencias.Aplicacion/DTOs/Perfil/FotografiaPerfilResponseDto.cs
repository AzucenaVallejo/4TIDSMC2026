
namespace PortalEvidencias.Aplicacion.DTOs.Perfil;

public class FotografiaPerfilResponseDto
{
    public byte[] Contenido { get; set; } = Array.Empty<byte>();

    public string TipoContenido { get; set; } = string.Empty;
}
