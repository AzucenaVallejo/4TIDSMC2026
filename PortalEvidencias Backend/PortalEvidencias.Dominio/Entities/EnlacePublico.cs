using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class EnlacePublico
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public int CurriculumId { get; set; }

    public string Token { get; set; } = string.Empty;
    public string CodigoAcceso { get; set; } = string.Empty;

    public EstadoEnlacePublico Estado { get; set; }
        = EstadoEnlacePublico.Activo;

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaExpiracion { get; set; }
    public DateTime? FechaRevocacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public Curriculum Curriculum { get; set; } = null!;

    public bool PermitirDescarga { get; set; }
}