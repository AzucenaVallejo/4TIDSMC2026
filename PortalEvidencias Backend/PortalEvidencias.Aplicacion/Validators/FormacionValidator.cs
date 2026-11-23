
using PortalEvidencias.Aplicacion.DTOs.Formacion;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Validators;

public static class FormacionValidator
{
    public static void Validar(CrearFormacionRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Institucion,
            dto.NivelEducativo,
            dto.FechaInicio,
            dto.FechaFin,
            dto.EnCurso,
            dto.Carrera,
            dto.Descripcion,
            dto.DocumentoCertificadoId,
            dto.DocumentoTituloId);
    }

    public static void Validar(ActualizarFormacionRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Institucion,
            dto.NivelEducativo,
            dto.FechaInicio,
            dto.FechaFin,
            dto.EnCurso,
            dto.Carrera,
            dto.Descripcion,
            dto.DocumentoCertificadoId,
            dto.DocumentoTituloId);
    }

    public static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new InvalidOperationException(
                "El identificador del usuario no es válido.");
        }
    }

    public static void ValidarIdentificadores(int id, int usuarioId)
    {
        if (id <= 0)
        {
            throw new InvalidOperationException(
                "El identificador de la formación no es válido.");
        }

        ValidarUsuarioId(usuarioId);
    }

    public static NivelFormacion ConvertirNivel(string nivelEducativo)
    {
        if (string.IsNullOrWhiteSpace(nivelEducativo) ||
            !Enum.TryParse<NivelFormacion>(
                nivelEducativo.Trim(),
                ignoreCase: true,
                out var nivel) ||
            !Enum.IsDefined(typeof(NivelFormacion), nivel))
        {
            throw new InvalidOperationException(
                "El nivel educativo no es válido. Utiliza un valor como Preparatoria, TSU, Licenciatura o Ingenieria.");
        }

        return nivel;
    }

    private static void ValidarDatos(
        string institucion,
        string nivelEducativo,
        DateOnly? fechaInicio,
        DateOnly? fechaFin,
        bool enCurso,
        string? carrera,
        string? descripcion,
        int? documentoCertificadoId,
        int? documentoTituloId)
    {
        if (string.IsNullOrWhiteSpace(institucion))
        {
            throw new InvalidOperationException(
                "La institución educativa es obligatoria.");
        }

        if (institucion.Trim().Length > 150)
        {
            throw new InvalidOperationException(
                "La institución no puede superar los 150 caracteres.");
        }

        if (string.IsNullOrWhiteSpace(nivelEducativo))
        {
            throw new InvalidOperationException(
                "El nivel educativo es obligatorio.");
        }

        if (nivelEducativo.Trim().Length > 150)
        {
            throw new InvalidOperationException(
                "El nivel educativo no puede superar los 150 caracteres.");
        }

        // Comprueba que el nivel recibido exista en el enum.
        ConvertirNivel(nivelEducativo);

        if (carrera?.Trim().Length > 200)
        {
            throw new InvalidOperationException(
                "El nombre del programa no puede superar los 200 caracteres.");
        }

        if (descripcion?.Trim().Length > 500)
        {
            throw new InvalidOperationException(
                "La descripción no puede superar los 500 caracteres.");
        }

        if (fechaInicio.HasValue &&
            fechaInicio.Value > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new InvalidOperationException(
                "La fecha de inicio no puede ser futura.");
        }

        if (!enCurso &&
            fechaFin.HasValue &&
            fechaFin.Value > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new InvalidOperationException(
                "La fecha de finalización no puede ser futura.");
        }

        if (!enCurso &&
            fechaInicio.HasValue &&
            fechaFin.HasValue &&
            fechaFin.Value < fechaInicio.Value)
        {
            throw new InvalidOperationException(
                "La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }

        ValidarDocumentoId(documentoCertificadoId);
        ValidarDocumentoId(documentoTituloId);
    }

    private static void ValidarDocumentoId(int? documentoId)
    {
        if (documentoId.HasValue && documentoId.Value <= 0)
        {
            throw new InvalidOperationException(
                "El identificador del documento no es válido.");
        }
    }
}
