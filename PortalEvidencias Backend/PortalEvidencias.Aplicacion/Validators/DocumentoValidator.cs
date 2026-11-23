
using System.ComponentModel.DataAnnotations;
using System.IO;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Validators;

public static class DocumentoValidator
{
    private const int TamanoMaximoDocumento = 10 * 1024 * 1024;
    private const int TamanoMaximoFotografia = 5 * 1024 * 1024;

    public static void ValidarIdentificadores(
        int documentoId,
        int usuarioId)
    {
        if (documentoId <= 0)
        {
            throw new ArgumentException(
                "El identificador del documento no es válido.");
        }

        ValidarUsuarioId(usuarioId);
    }

    public static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new ArgumentException(
                "El usuario no es válido.");
        }
    }

    public static void ValidarSubida(
        int usuarioId,
        string nombreArchivo,
        string tipoContenido,
        byte[]? contenido,
        TipoDocumento tipoDocumento,
        int? proyectoId)
    {
        ValidarUsuarioId(usuarioId);

        if (!Enum.IsDefined(typeof(TipoDocumento), tipoDocumento))
        {
            throw new ArgumentException(
                "El tipo de documento no es válido.");
        }

        if (proyectoId.HasValue && proyectoId.Value <= 0)
        {
            throw new ArgumentException(
                "El proyecto no es válido.");
        }

        if (string.IsNullOrWhiteSpace(nombreArchivo))
        {
            throw new ArgumentException(
                "El nombre del archivo es obligatorio.");
        }

        string nombreSeguro = Path.GetFileName(nombreArchivo.Trim());

        if (string.IsNullOrWhiteSpace(nombreSeguro))
        {
            throw new ArgumentException(
                "El nombre del archivo no es válido.");
        }

        if (string.IsNullOrWhiteSpace(tipoContenido))
        {
            throw new ArgumentException(
                "El tipo de contenido es obligatorio.");
        }

        if (contenido is null || contenido.Length == 0)
        {
            throw new ArgumentException(
                "El archivo está vacío.");
        }

        int limite = tipoDocumento == TipoDocumento.FotografiaPerfil
            ? TamanoMaximoFotografia
            : TamanoMaximoDocumento;

        if (contenido.Length > limite)
        {
            throw new ArgumentException(
                $"El archivo supera el límite permitido de " +
                $"{limite / (1024 * 1024)} MB.");
        }
    }
}
