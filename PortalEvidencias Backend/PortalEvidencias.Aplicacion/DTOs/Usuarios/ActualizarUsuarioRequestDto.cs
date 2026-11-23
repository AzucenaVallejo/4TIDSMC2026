using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Usuarios;

public class ActualizarUsuarioRequestDto
{
    [Required, MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;
}