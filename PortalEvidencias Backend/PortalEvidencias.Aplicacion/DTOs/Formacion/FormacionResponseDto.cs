namespace PortalEvidencias.Aplicacion.DTOs.Formacion;

public class FormacionResponseDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public string Institucion { get; set; } = string.Empty;
    public string NivelEducativo { get; set; } = string.Empty;
    public string? Carrera { get; set; }
    public string? Descripcion { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public bool EnCurso { get; set; }

    public int? DocumentoCertificadoId { get; set; }
    public int? DocumentoTituloId { get; set; }

}