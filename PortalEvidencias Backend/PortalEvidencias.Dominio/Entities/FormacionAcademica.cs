
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Dominio.Entities;

public class FormacionAcademica
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public NivelFormacion Nivel { get; set; }
    public string Institucion { get; set; } = string.Empty;
    public string NombrePrograma { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EnCurso { get; set; }

    public int? DocumentoCertificadoId { get; set; }
    public int? DocumentoTituloId { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
