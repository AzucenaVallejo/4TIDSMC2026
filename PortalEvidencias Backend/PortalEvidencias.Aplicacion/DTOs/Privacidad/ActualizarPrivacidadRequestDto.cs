using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Privacidad;

public class ActualizarPrivacidadRequestDto
{
    [Required]
    public List<int> DocumentosPublicos { get; set; } = [];
}