using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Habilidades;

public class ActualizarHabilidadRequestDto
{
    [Required]
    [StringLength(120, MinimumLength = 1)]
    public string Nombre { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Descripcion { get; set; }

    [Required]
    public string Categoria { get; set; } = string.Empty;

    [Required]
    public string Nivel { get; set; } = string.Empty;

    public string? Experiencia { get; set; }
}