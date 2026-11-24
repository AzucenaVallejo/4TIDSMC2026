namespace PortalEvidencias.Aplicacion.DTOs.Curriculum;

public class CurriculumResponseDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool EsPredeterminado { get; set; }
    public bool EsPublico { get; set; }
    public DateTime FechaCreacion { get; set; }
    public List<SeccionCurriculumDto> Secciones { get; set; } = [];
}