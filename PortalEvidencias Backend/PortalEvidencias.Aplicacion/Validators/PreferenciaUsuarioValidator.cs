using System.Text.RegularExpressions;
using PortalEvidencias.Aplicacion.DTOs.Preferencias;

namespace PortalEvidencias.Aplicacion.Validators;

public static class PreferenciaUsuarioValidator
{
    private static readonly string[] Temas =
    {
    "classic",
    "ocean",
    "rose",
    "forest",
    "coffee",
    "midnight",
    "abyss",
    "monochrome",
    "lavender",
    "sunset",
    "emerald",
    "olive",
    "sage",
    "sand",
    "cherry",
    "arctic",
    "plum",
    "copper",
    "slate",
    "mint",
    "crimson",
    "graphite",
    "nordic",
    "sapphire",
    "obsidian",
    "solar",

    // Compatibilidad temporal con preferencias anteriores
    "light",
    "dark",
    "auto"
};

    private static readonly string[] TamanosTexto =
    {
        "small",
        "medium",
        "large"
    };

    private static readonly string[] Idiomas =
    {
        "es",
        "en",
        "it"
    };

    public static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new InvalidOperationException(
                "El identificador del usuario no es válido.");
        }
    }

    public static void Validar(ActualizarPreferenciasRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (!Temas.Contains(dto.Tema?.Trim().ToLowerInvariant()))
        {
            throw new InvalidOperationException(
                "El tema seleccionado no es válido.");
        }

        if (!TamanosTexto.Contains(
            dto.TamanoTexto?.Trim().ToLowerInvariant()))
        {
            throw new InvalidOperationException(
                "El tamaño de texto seleccionado no es válido.");
        }

        if (string.IsNullOrWhiteSpace(dto.ColorAcento) ||
            !Regex.IsMatch(dto.ColorAcento.Trim(), "^#[0-9a-fA-F]{6}$"))
        {
            throw new InvalidOperationException(
                "El color de acento debe ser un hexadecimal válido de seis caracteres.");
        }

        if (!Idiomas.Contains(dto.Idioma?.Trim().ToLowerInvariant()))
        {
            throw new InvalidOperationException(
                "El idioma seleccionado no está disponible. Utiliza es, en o it.");
        }
    }
}