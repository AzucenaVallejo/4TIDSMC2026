using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Intereses;

public class CrearInteresRequestDto
{
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Descripcion { get; set; }

    [MaxLength(100)]
    public string? Icono { get; set; }

    [Required]
    [MaxLength(50)]
    public string Categoria { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? CategoriaPersonalizada { get; set; }

    [Required]
    [MaxLength(30)]
    public string Tipo { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string Frecuencia { get; set; } = string.Empty;

    public bool IncludePublic { get; set; }

    public bool IncludeCV { get; set; }
}