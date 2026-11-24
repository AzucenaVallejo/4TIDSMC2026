namespace PortalEvidencias.Aplicacion.DTOs.Preferencias;

public class PreferenciasResponseDto
{
    public int Id { get; set; }

    public string Tema { get; set; } = "auto";
    public string ColorAcento { get; set; } = "#2563eb";
    public string TamanoTexto { get; set; } = "medium";

    public bool ReducirAnimaciones { get; set; }
    public bool DensidadCompacta { get; set; }

    public bool NotificacionesGenerales { get; set; }
    public bool RecordatoriosPerfil { get; set; }
    public bool AvisosEvidencias { get; set; }

    public string Idioma { get; set; } = "es";

    public DateTime FechaActualizacion { get; set; }
}