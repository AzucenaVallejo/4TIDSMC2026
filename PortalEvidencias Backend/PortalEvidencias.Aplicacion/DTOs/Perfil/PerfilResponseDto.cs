public class PerfilResponseDto
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string? Nombres { get; set; }
    public string? ApellidoPaterno { get; set; }
    public string? ApellidoMaterno { get; set; }
    public string? NombreCompleto { get; set; }

    public string? Telefono { get; set; }
    public string? Biografia { get; set; }

    public DateOnly? FechaNacimiento { get; set; }
    public string? Curp { get; set; }

    public string? RutaFotografia { get; set; }
}