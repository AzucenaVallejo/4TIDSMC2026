using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class VisitaEnlacePublico
{
    public int Id { get; set; }

    public int EnlacePublicoId { get; set; }

    public TipoEventoEnlacePublico TipoEvento { get; set; }

    public DateTime FechaEvento { get; set; } = DateTime.UtcNow;

    public string? IdentificadorVisitante { get; set; }

    public EnlacePublico EnlacePublico { get; set; } = null!;
}