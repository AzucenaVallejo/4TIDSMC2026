
namespace PortalEvidencias.Dominio.Entities;

public class RefreshToken
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime FechaExpiracion { get; set; }
    public DateTime? FechaRevocacion { get; set; }

    public string? DireccionIpCreacion { get; set; }
    public string? MotivoRevocacion { get; set; }

    public Usuario Usuario { get; set; } = null!;

    public bool EstaActivo =>
        FechaRevocacion is null &&
        FechaExpiracion > DateTime.UtcNow;
}
