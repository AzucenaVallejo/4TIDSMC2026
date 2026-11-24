using PortalEvidencias.Aplicacion.DTOs.Actividades;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class ActividadService : IActividadService
{
    private readonly IActividadRepository _actividadRepository;

    public ActividadService(IActividadRepository actividadRepository)
    {
        _actividadRepository = actividadRepository;
    }

    public async Task<List<ActividadResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);

        var actividades =
            await _actividadRepository.ObtenerPorUsuarioAsync(usuarioId);

        return actividades.Select(MapearRespuesta).ToList();
    }

    public async Task<ActividadResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId)
    {
        ValidarIdentificadores(id, usuarioId);

        var actividad =
            await _actividadRepository.ObtenerPorIdYUsuarioAsync(
                id,
                usuarioId);

        return actividad is null
            ? null
            : MapearRespuesta(actividad);
    }

    public async Task<ActividadResponseDto> CrearAsync(
        int usuarioId,
        CrearActividadRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Nombre,
            dto.Organizacion,
            dto.Descripcion,
            dto.Tipo,
            dto.Modalidad,
            dto.Estado,
            dto.FechaInicio,
            dto.FechaFin,
            dto.Duracion,
            dto.UnidadDuracion);

        var documento = await ObtenerDocumentoValidoAsync(
            dto.DocumentoId,
            usuarioId);

        var actividad = new ActividadExtracurricular
        {
            UsuarioId = usuarioId,
            Nombre = dto.Nombre.Trim(),
            Tipo = dto.Tipo,
            Modalidad = dto.Modalidad,
            Organizacion = NormalizarTexto(dto.Organizacion),
            Descripcion = NormalizarTexto(dto.Descripcion),
            Estado = dto.Estado,
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.FechaFin,
            Duracion = dto.Duracion,
            UnidadDuracion = dto.UnidadDuracion,
            Documento = documento,
            FechaCreacion = DateTime.UtcNow
        };

        await _actividadRepository.AgregarAsync(actividad);
        await _actividadRepository.GuardarCambiosAsync();

        return MapearRespuesta(actividad);
    }

    public async Task<ActividadResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarActividadRequestDto dto)
    {
        ValidarIdentificadores(id, usuarioId);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Nombre,
            dto.Organizacion,
            dto.Descripcion,
            dto.Tipo,
            dto.Modalidad,
            dto.Estado,
            dto.FechaInicio,
            dto.FechaFin,
            dto.Duracion,
            dto.UnidadDuracion);

        var actividad =
            await _actividadRepository.ObtenerPorIdYUsuarioAsync(
                id,
                usuarioId)
            ?? throw new KeyNotFoundException(
                "No se encontró la actividad extracurricular solicitada.");

        var documentoActualId = actividad.Documento?.Id;

        if (dto.DocumentoId != documentoActualId)
        {
            actividad.Documento = await ObtenerDocumentoValidoAsync(
                dto.DocumentoId,
                usuarioId,
                actividad.Id);
        }

        actividad.Nombre = dto.Nombre.Trim();
        actividad.Tipo = dto.Tipo;
        actividad.Modalidad = dto.Modalidad;
        actividad.Organizacion = NormalizarTexto(dto.Organizacion);
        actividad.Descripcion = NormalizarTexto(dto.Descripcion);
        actividad.Estado = dto.Estado;
        actividad.FechaInicio = dto.FechaInicio;
        actividad.FechaFin = dto.FechaFin;
        actividad.Duracion = dto.Duracion;
        actividad.UnidadDuracion = dto.UnidadDuracion;
        actividad.FechaActualizacion = DateTime.UtcNow;

        _actividadRepository.Actualizar(actividad);
        await _actividadRepository.GuardarCambiosAsync();

        return MapearRespuesta(actividad);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        ValidarIdentificadores(id, usuarioId);

        var actividad =
            await _actividadRepository.ObtenerPorIdYUsuarioAsync(
                id,
                usuarioId)
            ?? throw new KeyNotFoundException(
                "No se encontró la actividad extracurricular solicitada.");

        if (actividad.Documento is not null)
        {
            actividad.Documento.ActividadExtracurricularId = null;
            actividad.Documento.ActividadExtracurricular = null;
        }

        _actividadRepository.Eliminar(actividad);
        await _actividadRepository.GuardarCambiosAsync();
    }

    private async Task<Documento?> ObtenerDocumentoValidoAsync(
        int? documentoId,
        int usuarioId,
        int? actividadActualId = null)
    {
        if (!documentoId.HasValue)
            return null;

        if (documentoId.Value <= 0)
        {
            throw new InvalidOperationException(
                "El identificador del documento no es válido.");
        }

        var documento =
            await _actividadRepository.ObtenerDocumentoPorIdYUsuarioAsync(
                documentoId.Value,
                usuarioId);

        if (documento is null)
        {
            throw new InvalidOperationException(
                "El documento no existe, no pertenece al usuario o no está activo.");
        }

        var vinculado =
            await _actividadRepository.DocumentoEstaVinculadoAsync(
                documentoId.Value,
                actividadActualId);

        if (vinculado)
        {
            throw new InvalidOperationException(
                "El documento ya está asociado a otro elemento.");
        }

        return documento;
    }

    private static void ValidarDatos(
        string nombre,
        string? organizacion,
        string? descripcion,
        TipoActividadExtracurricular tipo,
        ModalidadActividadExtracurricular modalidad,
        EstadoActividadExtracurricular estado,
        DateOnly? fechaInicio,
        DateOnly? fechaFin,
        decimal? duracion,
        UnidadDuracionActividad? unidadDuracion)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new InvalidOperationException(
                "El nombre de la actividad es obligatorio.");
        }

        if (nombre.Trim().Length > 200)
        {
            throw new InvalidOperationException(
                "El nombre no puede superar los 200 caracteres.");
        }

        if (organizacion?.Trim().Length > 200)
        {
            throw new InvalidOperationException(
                "La organización no puede superar los 200 caracteres.");
        }

        if (descripcion?.Trim().Length > 3000)
        {
            throw new InvalidOperationException(
                "La descripción no puede superar los 3000 caracteres.");
        }

        if (!Enum.IsDefined(tipo))
        {
            throw new InvalidOperationException(
                "El tipo de actividad no es válido.");
        }

        if (!Enum.IsDefined(modalidad))
        {
            throw new InvalidOperationException(
                "La modalidad de la actividad no es válida.");
        }

        if (!Enum.IsDefined(estado))
        {
            throw new InvalidOperationException(
                "El estado de la actividad no es válido.");
        }

        if (fechaInicio.HasValue &&
            fechaFin.HasValue &&
            fechaFin.Value < fechaInicio.Value)
        {
            throw new InvalidOperationException(
                "La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }

        if (duracion.HasValue && duracion.Value <= 0)
        {
            throw new InvalidOperationException(
                "La duración debe ser mayor que cero.");
        }

        if (duracion.HasValue != unidadDuracion.HasValue)
        {
            throw new InvalidOperationException(
                "Debes indicar tanto la duración como su unidad.");
        }

        if (unidadDuracion.HasValue &&
            !Enum.IsDefined(unidadDuracion.Value))
        {
            throw new InvalidOperationException(
                "La unidad de duración no es válida.");
        }

        if (estado == EstadoActividadExtracurricular.EnCurso &&
            fechaFin.HasValue)
        {
            throw new InvalidOperationException(
                "Una actividad en curso no debe tener fecha de finalización.");
        }

        if (estado == EstadoActividadExtracurricular.Finalizada &&
            fechaInicio.HasValue &&
            !fechaFin.HasValue)
        {
            throw new InvalidOperationException(
                "Una actividad finalizada debe tener fecha de finalización.");
        }
    }

    private static string? NormalizarTexto(string? valor)
    {
        return string.IsNullOrWhiteSpace(valor)
            ? null
            : valor.Trim();
    }

    private static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new InvalidOperationException(
                "El identificador del usuario no es válido.");
        }
    }

    private static void ValidarIdentificadores(int id, int usuarioId)
    {
        if (id <= 0)
        {
            throw new InvalidOperationException(
                "El identificador de la actividad no es válido.");
        }

        ValidarUsuarioId(usuarioId);
    }

    private static ActividadResponseDto MapearRespuesta(
        ActividadExtracurricular actividad)
    {
        return new ActividadResponseDto
        {
            Id = actividad.Id,
            UsuarioId = actividad.UsuarioId,
            Nombre = actividad.Nombre,
            Tipo = actividad.Tipo,
            Modalidad = actividad.Modalidad,
            Organizacion = actividad.Organizacion,
            Descripcion = actividad.Descripcion,
            Estado = actividad.Estado,
            FechaInicio = actividad.FechaInicio,
            FechaFin = actividad.FechaFin,
            Duracion = actividad.Duracion,
            UnidadDuracion = actividad.UnidadDuracion,
            DocumentoId = actividad.Documento?.Id,
            NombreDocumento = actividad.Documento?.NombreArchivo,
            TipoContenidoDocumento = actividad.Documento?.TipoContenido,
            TamanoDocumento = actividad.Documento?.TamanoBytes
        };
    }
}