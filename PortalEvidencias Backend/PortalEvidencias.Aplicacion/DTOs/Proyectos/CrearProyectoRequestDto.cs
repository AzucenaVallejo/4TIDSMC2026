using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Proyectos;

public class CrearProyectoRequestDto
{
    [Required, MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(1500)]
    public string? Descripcion { get; set; }

    [MaxLength(100)]
    public string? Tecnologias { get; set; }

    [MaxLength(300)]
    public string? UrlRepositorio { get; set; }

    [MaxLength(300)]
    public string? UrlDemostracion { get; set; }

    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EsDestacado { get; set; }
}