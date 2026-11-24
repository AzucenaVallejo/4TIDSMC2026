using System.ComponentModel.DataAnnotations;

public class ActualizarPerfilRequestDto
{
    [Required]
    [MaxLength(100)]
    public string Nombres { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string ApellidoPaterno { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? ApellidoMaterno { get; set; }

    [MaxLength(25)]
    public string? Telefono { get; set; }

    [MaxLength(2000)]
    public string? Biografia { get; set; }

    public DateOnly? FechaNacimiento { get; set; }

    public bool EliminarFechaNacimiento { get; set; }

    [MaxLength(18)]
    public string? Curp { get; set; }
}