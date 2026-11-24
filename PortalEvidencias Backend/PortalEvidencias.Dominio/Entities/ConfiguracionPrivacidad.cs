namespace PortalEvidencias.Dominio.Entities;

public class ConfiguracionPrivacidad
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public string DocumentosPublicosJson { get; set; } = "[]";

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaActualizacion { get; set; }
}