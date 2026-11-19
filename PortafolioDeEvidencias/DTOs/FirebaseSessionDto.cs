
using System.ComponentModel.DataAnnotations;

namespace PortafolioDeEvidencias.DTOs
{
    public class FirebaseSessionDto
    {
        [Required(ErrorMessage = "El token es obligatorio.")]
        public string IdToken { get; set; } = string.Empty;
    }
}
