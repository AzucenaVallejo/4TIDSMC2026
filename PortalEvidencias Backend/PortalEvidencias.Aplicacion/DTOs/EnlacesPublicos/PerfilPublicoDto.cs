namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class PerfilPublicoDto
{
    public string NombreCompleto { get; set; } = string.Empty;

    public string? Biografia { get; set; }

    public string? RutaFotografia { get; set; }

    public string? Correo { get; set; }

    public string? Telefono { get; set; }
}