namespace PortalEvidencias.Aplicacion.DTOs.Habilidades;

public class HabilidadResponseDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string? Nivel { get; set; }
    public string? Experiencia { get; set; }
}