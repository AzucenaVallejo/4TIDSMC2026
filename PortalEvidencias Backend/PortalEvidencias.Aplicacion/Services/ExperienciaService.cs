
using PortalEvidencias.Aplicacion.DTOs.Experiencia;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class ExperienciaService : IExperienciaService
{
    private readonly IExperienciaRepository _experienciaRepository;

    public ExperienciaService(
        IExperienciaRepository experienciaRepository)
    {
        _experienciaRepository = experienciaRepository;
    }

    public async Task<List<ExperienciaResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        var experiencias =
            await _experienciaRepository.ObtenerPorUsuarioAsync(usuarioId);

        return experiencias.Select(MapearRespuesta).ToList();
    }

    public async Task<ExperienciaResponseDto> ObtenerPorIdAsync(
        int id,
        int usuarioId)
    {
        ValidarIdentificadores(id, usuarioId);

        var experiencia =
            await _experienciaRepository.ObtenerPorIdYUsuarioAsync(
                id,
                usuarioId);

        if (experiencia is null)
            throw new KeyNotFoundException(
                "No se encontró la experiencia laboral solicitada.");

        return MapearRespuesta(experiencia);
    }

    public async Task<ExperienciaResponseDto> CrearAsync(
        CrearExperienciaRequestDto dto,
        int usuarioId)
    {
        ArgumentNullException.ThrowIfNull(dto);

        ValidarUsuario(usuarioId);
        ValidarDatos(
            dto.Empresa,
            dto.Puesto,
            dto.Tipo,
            dto.Modalidad,
            dto.FechaInicio,
            dto.FechaFin,
            dto.TrabajoActual);

        var documento = await ObtenerDocumentoValidoAsync(
            dto.DocumentoId,
            usuarioId,
            0);

        var experiencia = new ExperienciaLaboral
        {
            UsuarioId = usuarioId,
            Empresa = dto.Empresa.Trim(),
            Puesto = dto.Puesto.Trim(),
            Tipo = dto.Tipo,
            Modalidad = dto.Modalidad,
            Ubicacion = NormalizarTexto(dto.Ubicacion),
            Descripcion = NormalizarTexto(dto.Descripcion),
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.TrabajoActual ? null : dto.FechaFin,
            TrabajoActual = dto.TrabajoActual,
            FechaCreacion = DateTime.UtcNow,
            Documento = documento
        };

        await _experienciaRepository.AgregarAsync(experiencia);
        await _experienciaRepository.GuardarCambiosAsync();

        return MapearRespuesta(experiencia);
    }

    public async Task<ExperienciaResponseDto> ActualizarAsync(
        int id,
        ActualizarExperienciaRequestDto dto,
        int usuarioId)
    {
        ArgumentNullException.ThrowIfNull(dto);

        ValidarIdentificadores(id, usuarioId);

        ValidarDatos(
            dto.Empresa,
            dto.Puesto,
            dto.Tipo,
            dto.Modalidad,
            dto.FechaInicio,
            dto.FechaFin,
            dto.TrabajoActual);

        var experiencia =
            await _experienciaRepository.ObtenerPorIdYUsuarioAsync(
                id,
                usuarioId);

        if (experiencia is null)
            throw new KeyNotFoundException(
                "No se encontró la experiencia laboral solicitada.");

        var documentoActualId = experiencia.Documento?.Id;
        var documentoNuevoId = dto.DocumentoId;

        if (documentoActualId != documentoNuevoId)
        {
            experiencia.Documento = await ObtenerDocumentoValidoAsync(
                documentoNuevoId,
                usuarioId,
                experiencia.Id);
        }

        experiencia.Empresa = dto.Empresa.Trim();
        experiencia.Puesto = dto.Puesto.Trim();
        experiencia.Tipo = dto.Tipo;
        experiencia.Modalidad = dto.Modalidad;
        experiencia.Ubicacion = NormalizarTexto(dto.Ubicacion);
        experiencia.Descripcion = NormalizarTexto(dto.Descripcion);
        experiencia.FechaInicio = dto.FechaInicio;
        experiencia.FechaFin = dto.TrabajoActual ? null : dto.FechaFin;
        experiencia.TrabajoActual = dto.TrabajoActual;
        experiencia.FechaActualizacion = DateTime.UtcNow;

        _experienciaRepository.Actualizar(experiencia);
        await _experienciaRepository.GuardarCambiosAsync();

        return MapearRespuesta(experiencia);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        ValidarIdentificadores(id, usuarioId);

        var experiencia =
            await _experienciaRepository.ObtenerPorIdYUsuarioAsync(
                id,
                usuarioId);

        if (experiencia is null)
            throw new KeyNotFoundException(
                "No se encontró la experiencia laboral solicitada.");

        if (experiencia.Documento is not null)
        {
            experiencia.Documento.ExperienciaLaboralId = null;
            experiencia.Documento.ExperienciaLaboral = null;
        }

        _experienciaRepository.Eliminar(experiencia);

        await _experienciaRepository.GuardarCambiosAsync();
    }

    private async Task<Documento?> ObtenerDocumentoValidoAsync(
        int? documentoId,
        int usuarioId,
        int experienciaActualId)
    {
        if (documentoId is null)
            return null;

        if (documentoId <= 0)
            throw new ArgumentException(
                "El identificador del documento no es válido.");

        var documento =
            await _experienciaRepository.ObtenerDocumentoPorIdYUsuarioAsync(
                documentoId.Value,
                usuarioId);

        if (documento is null)
            throw new KeyNotFoundException(
                "No se encontró el documento solicitado.");

        if (documento.Estado != EstadoDocumento.Activo)
            throw new InvalidOperationException(
                "El documento no se encuentra activo.");

        if (documento.TipoDocumento != TipoDocumento.ConstanciaLaboral)
            throw new InvalidOperationException(
                "El documento no corresponde a una constancia laboral.");

        var estaVinculado =
            await _experienciaRepository.DocumentoEstaVinculadoAsync(
                documentoId.Value,
                experienciaActualId);

        if (estaVinculado)
            throw new InvalidOperationException(
                "El documento ya está asociado a otro registro.");

        return documento;
    }

    private static void ValidarDatos(
        string empresa,
        string puesto,
        TipoExperienciaLaboral tipo,
        ModalidadExperienciaLaboral modalidad,
        DateOnly fechaInicio,
        DateOnly? fechaFin,
        bool trabajoActual)
    {
        if (string.IsNullOrWhiteSpace(empresa))
            throw new ArgumentException(
                "El nombre de la empresa es obligatorio.");

        if (empresa.Trim().Length > 150)
            throw new ArgumentException(
                "El nombre de la empresa no puede superar 150 caracteres.");

        if (string.IsNullOrWhiteSpace(puesto))
            throw new ArgumentException(
                "El puesto es obligatorio.");

        if (puesto.Trim().Length > 150)
            throw new ArgumentException(
                "El puesto no puede superar 150 caracteres.");

        if (!Enum.IsDefined(typeof(TipoExperienciaLaboral), tipo))
            throw new ArgumentException(
                "El tipo de experiencia no es válido.");

        if (!Enum.IsDefined(typeof(ModalidadExperienciaLaboral), modalidad))
            throw new ArgumentException(
                "La modalidad de trabajo no es válida.");

        if (fechaInicio == default)
            throw new ArgumentException(
                "La fecha de inicio es obligatoria.");

        if (fechaInicio > DateOnly.FromDateTime(DateTime.UtcNow))
            throw new ArgumentException(
                "La fecha de inicio no puede ser futura.");

        if (trabajoActual && fechaFin.HasValue)
            throw new ArgumentException(
                "Una experiencia actual no debe tener fecha de finalización.");

        if (!trabajoActual && fechaFin.HasValue &&
            fechaFin.Value < fechaInicio)
            throw new ArgumentException(
                "La fecha de finalización no puede ser anterior a la fecha de inicio.");
    }

    private static void ValidarIdentificadores(int id, int usuarioId)
    {
        if (id <= 0)
            throw new ArgumentException(
                "El identificador de la experiencia no es válido.");

        ValidarUsuario(usuarioId);
    }

    private static void ValidarUsuario(int usuarioId)
    {
        if (usuarioId <= 0)
            throw new ArgumentException(
                "El identificador del usuario no es válido.");
    }

    private static string? NormalizarTexto(string? texto)
    {
        return string.IsNullOrWhiteSpace(texto)
            ? null
            : texto.Trim();
    }

    private static ExperienciaResponseDto MapearRespuesta(
        ExperienciaLaboral experiencia)
    {
        var documento = experiencia.Documento;

        return new ExperienciaResponseDto
        {
            Id = experiencia.Id,
            UsuarioId = experiencia.UsuarioId,
            Empresa = experiencia.Empresa,
            Puesto = experiencia.Puesto,
            Tipo = experiencia.Tipo,
            Modalidad = experiencia.Modalidad,
            Ubicacion = experiencia.Ubicacion,
            Descripcion = experiencia.Descripcion,
            FechaInicio = experiencia.FechaInicio,
            FechaFin = experiencia.FechaFin,
            TrabajoActual = experiencia.TrabajoActual,
            DocumentoId = documento?.Id,
            NombreDocumento = documento?.NombreArchivo,
            TipoContenidoDocumento = documento?.TipoContenido,
            TamanoDocumento = documento?.TamanoBytes
        };
    }
}
