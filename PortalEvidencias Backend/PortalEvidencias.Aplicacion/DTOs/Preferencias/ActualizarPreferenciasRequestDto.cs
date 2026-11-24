using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.DTOs.Preferencias;

public class ActualizarPreferenciasRequestDto
{
    [Required, MaxLength(10)]
    public string Tema { get; set; } = "auto";

    [Required, MaxLength(7)]
    public string ColorAcento { get; set; } = "#2563eb";

    [Required, MaxLength(10)]
    public string TamanoTexto { get; set; } = "medium";

    public bool ReducirAnimaciones { get; set; }
    public bool DensidadCompacta { get; set; }

    public bool NotificacionesGenerales { get; set; } = true;
    public bool RecordatoriosPerfil { get; set; } = true;
    public bool AvisosEvidencias { get; set; } = true;

    [Required, MaxLength(5)]
    public string Idioma { get; set; } = "es";
}