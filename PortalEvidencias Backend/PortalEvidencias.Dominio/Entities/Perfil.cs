
namespace PortalEvidencias.Dominio.Entities;

public class Perfil
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public string Nombres { get; set; } = string.Empty;
    public string ApellidoPaterno { get; set; } = string.Empty;
    public string ApellidoMaterno { get; set; } = string.Empty;

    public DateOnly? FechaNacimiento { get; set; }

    public string? Curp { get; set; }

    public string? Telefono { get; set; }
    public string? Biografia { get; set; }

    public string? FotografiaUrl { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
    public int? DocumentoFotografiaId { get; set; }

    public Documento? Fotografia { get; set; }
}
