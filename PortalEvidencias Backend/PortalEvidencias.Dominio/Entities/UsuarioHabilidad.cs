
namespace PortalEvidencias.Dominio.Entities;

public class UsuarioHabilidad
{
    public int UsuarioId { get; set; }
    public int HabilidadId { get; set; }

    public string? Nivel { get; set; }
    public int? PorcentajeDominio { get; set; }
    public string? Experiencia { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public Habilidad Habilidad { get; set; } = null!;
}
