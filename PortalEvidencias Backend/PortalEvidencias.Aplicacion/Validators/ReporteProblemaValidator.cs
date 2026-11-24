using PortalEvidencias.Aplicacion.DTOs.Reportes;

namespace PortalEvidencias.Aplicacion.Validators;

public static class ReporteProblemaValidator
{
    private static readonly string[] TiposPermitidos =
    {
        "bug",
        "account",
        "documents",
        "performance",
        "suggestion",
        "other"
    };

    public static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new InvalidOperationException(
                "El identificador del usuario no es válido.");
        }
    }

    public static void Validar(CrearReporteRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.Tipo) ||
            !TiposPermitidos.Contains(
                dto.Tipo.Trim().ToLowerInvariant()))
        {
            throw new InvalidOperationException(
                "El tipo de reporte no es válido.");
        }

        if (string.IsNullOrWhiteSpace(dto.Asunto) ||
            dto.Asunto.Trim().Length > 150)
        {
            throw new InvalidOperationException(
                "El asunto es obligatorio y no puede superar los 150 caracteres.");
        }

        if (string.IsNullOrWhiteSpace(dto.Descripcion) ||
            dto.Descripcion.Trim().Length > 2000)
        {
            throw new InvalidOperationException(
                "La descripción es obligatoria y no puede superar los 2000 caracteres.");
        }
    }
}