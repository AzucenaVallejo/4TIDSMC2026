namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class EnlacePublicoResponseDto
{
    public int Id { get; set; }
    public int CurriculumId { get; set; }

    public string Token { get; set; } = string.Empty;
    public string CodigoAcceso { get; set; } = string.Empty;

    public string UrlPublica { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaExpiracion { get; set; }
    public bool Activo { get; set; }
    public bool PermitirDescarga { get; set; }
}