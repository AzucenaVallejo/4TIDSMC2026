using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Reportes;

public class CrearReporteRequestDto
{
    [Required, MaxLength(30)]
    public string Tipo { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string Asunto { get; set; } = string.Empty;

    [Required, MaxLength(2000)]
    public string Descripcion { get; set; } = string.Empty;
}