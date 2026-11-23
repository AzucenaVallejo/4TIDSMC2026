
namespace PortalEvidencias.Aplicacion.DTOs.Practicas;

public class PracticaResponseDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Empresa { get; set; } = string.Empty;
    public string Puesto { get; set; } = string.Empty;
    public string? InstitucionEducativa { get; set; }
    public string? Descripcion { get; set; }

    public DateOnly FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EnCurso { get; set; }

    public int? HorasRealizadas { get; set; }
    public int? DocumentoId { get; set; }
}
