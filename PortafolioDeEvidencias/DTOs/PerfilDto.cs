
using System.ComponentModel.DataAnnotations;

namespace PortafolioDeEvidencias.DTOs
{
    public class PerfilDto
    {
        [Required(ErrorMessage = "Los nombres son obligatorios.")]
        public string Nombres { get; set; } = string.Empty;

        [Required(ErrorMessage = "El apellido paterno es obligatorio.")]
        public string ApellidoPaterno { get; set; } = string.Empty;

        public string ApellidoMaterno { get; set; } = string.Empty;

        public DateTime? FechaNacimiento { get; set; }

        public string Telefono { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Ingresa un correo válido.")]
        public string Correo { get; set; } = string.Empty;

        public string CURP { get; set; } = string.Empty;

        public string Domicilio { get; set; } = string.Empty;

        public string? Fotografia { get; set; }
    }
}
