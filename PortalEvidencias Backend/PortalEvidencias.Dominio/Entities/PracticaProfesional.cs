
namespace PortalEvidencias.Dominio.Entities;

public class PracticaProfesional
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Empresa { get; set; } = string.Empty;
    public string Puesto { get; set; } = string.Empty;
    public string? InstitucionEducativa { get; set; }
    public string? Descripcion { get; set; }

    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int? HorasRealizadas { get; set; }

    public int? DocumentoId { get; set; }
    public Documento? Documento { get; set; }

    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaActualizacion { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
