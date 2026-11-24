
namespace PortafolioDeEvidencias.Models
{
    public class Perfil
    {
        public int Id { get; set; }

        public int UsuarioId { get; set; }

        public string Nombres { get; set; } = string.Empty;

        public string ApellidoPaterno { get; set; } = string.Empty;

        public string ApellidoMaterno { get; set; } = string.Empty;

        public DateTime? FechaNacimiento { get; set; }

        public string Telefono { get; set; } = string.Empty;

        public string Correo { get; set; } = string.Empty;

        public string CURP { get; set; } = string.Empty;

        public string Domicilio { get; set; } = string.Empty;

        public string? Fotografia { get; set; }

        public Usuario Usuario { get; set; } = null!;
    }
}
