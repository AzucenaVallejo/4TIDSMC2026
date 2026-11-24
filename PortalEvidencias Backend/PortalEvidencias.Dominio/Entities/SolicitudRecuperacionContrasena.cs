
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class SolicitudRecuperacionContrasena
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public string CodigoHash { get; set; } = string.Empty;

    public DateTime FechaExpiracionCodigo { get; set; }

    public int IntentosFallidos { get; set; }

    public DateTime? FechaUltimoEnvio { get; set; }

    public string? TokenRestablecimientoHash { get; set; }

    public DateTime? FechaExpiracionToken { get; set; }

    public EstadoRecuperacion Estado { get; set; }
        = EstadoRecuperacion.Pendiente;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public DateTime? FechaVerificacion { get; set; }

    public DateTime? FechaCompletada { get; set; }

    // Relación con el usuario
    public Usuario Usuario { get; set; } = null!;
}
