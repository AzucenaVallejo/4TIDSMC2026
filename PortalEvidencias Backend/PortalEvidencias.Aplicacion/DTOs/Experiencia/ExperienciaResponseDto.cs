
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.DTOs.Experiencia;

public class ExperienciaResponseDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Empresa { get; set; } = string.Empty;
    public string Puesto { get; set; } = string.Empty;

    public TipoExperienciaLaboral Tipo { get; set; }
    public ModalidadExperienciaLaboral Modalidad { get; set; }

    public string? Ubicacion { get; set; }
    public string? Descripcion { get; set; }

    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool TrabajoActual { get; set; }

    public int? DocumentoId { get; set; }
    public string? NombreDocumento { get; set; }
    public string? TipoContenidoDocumento { get; set; }
    public long? TamanoDocumento { get; set; }
}
