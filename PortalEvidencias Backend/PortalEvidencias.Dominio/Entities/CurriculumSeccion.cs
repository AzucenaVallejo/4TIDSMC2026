
namespace PortalEvidencias.Dominio.Entities;

public class CurriculumSeccion
{
    public int Id { get; set; }
    public int CurriculumId { get; set; }

    public string TipoSeccion { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool Visible { get; set; } = true;

    public string? Configuracion { get; set; }

    public Curriculum Curriculum { get; set; } = null!;
}
