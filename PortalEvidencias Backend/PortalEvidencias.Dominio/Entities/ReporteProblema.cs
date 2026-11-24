using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class ReporteProblema
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Tipo { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;

    public EstadoReporte Estado { get; set; } = EstadoReporte.Pendiente;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }
}