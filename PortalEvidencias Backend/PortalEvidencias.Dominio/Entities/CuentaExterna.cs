using PortalEvidencias.Dominio.Enums;
namespace PortalEvidencias.Dominio.Entities;

public class CuentaExterna
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public ProveedorAutenticacion Proveedor { get; set; }
    public string IdentificadorExterno { get; set; } = string.Empty;
    public string? CorreoProveedor { get; set; }

    public DateTime FechaVinculacion { get; set; } = DateTime.UtcNow;

    public Usuario Usuario { get; set; } = null!;
}
