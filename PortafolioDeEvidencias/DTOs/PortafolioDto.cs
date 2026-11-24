namespace PortafolioDeEvidencias.DTOs
{
    public class PortafolioDto
    {
        public PerfilDto Profile { get; set; } = new();

        public List<RegistroPortafolioDto> Education { get; set; } = new();
        public List<RegistroPortafolioDto> Extra { get; set; } = new();
        public List<RegistroPortafolioDto> Experience { get; set; } = new();
        public List<RegistroPortafolioDto> Projects { get; set; } = new();

        public List<string> Skills { get; set; } = new();
        public List<string> Interests { get; set; } = new();
    }

    public class RegistroPortafolioDto
    {
        public long Id { get; set; }
        public string Title { get; set; } = "";
        public string Institution { get; set; } = "";
        public string Period { get; set; } = "";
        public string Detail { get; set; } = "";
    }
}
