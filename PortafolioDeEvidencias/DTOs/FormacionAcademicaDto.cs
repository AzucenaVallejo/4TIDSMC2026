
using System.ComponentModel.DataAnnotations;

namespace PortafolioDeEvidencias.DTOs
{
    public class FormacionAcademicaDto
    {
        [Required(ErrorMessage = "Selecciona el nivel educativo.")]
        public string NivelEducativo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El nombre de la institución es obligatorio.")]
        public string Institucion { get; set; } = string.Empty;

        public string? NombreCertificado { get; set; }

        public DateTime? FechaInicio { get; set; }

        public DateTime? FechaFin { get; set; }

        public string? Certificado { get; set; }
    }
}
