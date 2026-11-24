namespace PortalEvidencias.Dominio.Entities;

public class Habilidad
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activa { get; set; } = true;

    public string Categoria { get; set; } = string.Empty;

    public string? Nivel { get; set; }

    public int? PorcentajeDominio { get; set; }

    public string? Experiencia { get; set; }

    public Usuario Usuario { get; set; } = null!;
}