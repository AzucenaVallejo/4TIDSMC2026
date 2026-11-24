
using PortalEvidencias.Aplicacion.DTOs.Practicas;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class PracticaService : IPracticaService
{
    private readonly IPracticaRepository _practicaRepository;
    private readonly IDocumentoRepository _documentoRepository;

    public PracticaService(
        IPracticaRepository practicaRepository,
        IDocumentoRepository documentoRepository)
    {
        _practicaRepository = practicaRepository;
        _documentoRepository = documentoRepository;
    }

    public async Task<List<PracticaResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);

        var practicas = await _practicaRepository
            .ObtenerPorUsuarioAsync(usuarioId);

        return practicas.Select(MapearRespuesta).ToList();
    }

    public async Task<PracticaResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId)
    {
        ValidarPracticaId(id);
        ValidarUsuarioId(usuarioId);

        var practica = await _practicaRepository
            .ObtenerPorIdYUsuarioAsync(id, usuarioId);

        return practica is null ? null : MapearRespuesta(practica);
    }

    public async Task<PracticaResponseDto> CrearAsync(
        int usuarioId,
        CrearPracticaRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Empresa,
            dto.Puesto,
            dto.InstitucionEducativa,
            dto.Descripcion,
            dto.FechaInicio,
            dto.FechaFin,
            dto.EnCurso,
            dto.HorasRealizadas);

        await ValidarDocumentoAsync(dto.DocumentoId, usuarioId);

        var practica = new PracticaProfesional
        {
            UsuarioId = usuarioId,
            Empresa = dto.Empresa.Trim(),
            Puesto = dto.Puesto.Trim(),
            InstitucionEducativa = NormalizarTexto(
                dto.InstitucionEducativa),
            Descripcion = NormalizarTexto(dto.Descripcion),
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.EnCurso ? null : dto.FechaFin,
            HorasRealizadas = dto.HorasRealizadas,
            DocumentoId = dto.DocumentoId,
            FechaCreacion = DateTime.UtcNow
        };

        await _practicaRepository.AgregarAsync(practica);
        await _practicaRepository.GuardarCambiosAsync();

        return MapearRespuesta(practica);
    }

    public async Task<PracticaResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarPracticaRequestDto dto)
    {
        ValidarPracticaId(id);
        ValidarUsuarioId(usuarioId);
        ArgumentNullException.ThrowIfNull(dto);

        ValidarDatos(
            dto.Empresa,
            dto.Puesto,
            dto.InstitucionEducativa,
            dto.Descripcion,
            dto.FechaInicio,
            dto.FechaFin,
            dto.EnCurso,
            dto.HorasRealizadas);

        await ValidarDocumentoAsync(dto.DocumentoId, usuarioId);

        var practica = await _practicaRepository
            .ObtenerPorIdYUsuarioAsync(id, usuarioId);

        if (practica is null)
        {
            throw new KeyNotFoundException(
                "No se encontró la práctica profesional solicitada.");
        }

        practica.Empresa = dto.Empresa.Trim();
        practica.Puesto = dto.Puesto.Trim();
        practica.InstitucionEducativa = NormalizarTexto(
            dto.InstitucionEducativa);
        practica.Descripcion = NormalizarTexto(dto.Descripcion);
        practica.FechaInicio = dto.FechaInicio;
        practica.FechaFin = dto.EnCurso ? null : dto.FechaFin;
        practica.HorasRealizadas = dto.HorasRealizadas;
        practica.DocumentoId = dto.DocumentoId;
        practica.FechaActualizacion = DateTime.UtcNow;

        _practicaRepository.Actualizar(practica);
        await _practicaRepository.GuardarCambiosAsync();

        return MapearRespuesta(practica);
    }

    public async Task<bool> ExisteDocumentoAsociadoAsync(int documentoId)
    {
        if (documentoId <= 0)
        {
            throw new ArgumentException(
                "El identificador del documento debe ser mayor que cero.");
        }

        return await _practicaRepository
            .ExisteDocumentoAsociadoAsync(documentoId);
    }


    public async Task EliminarAsync(int id, int usuarioId)
    {
        ValidarPracticaId(id);
        ValidarUsuarioId(usuarioId);

        var practica = await _practicaRepository
            .ObtenerPorIdYUsuarioAsync(id, usuarioId);

        if (practica is null)
        {
            throw new KeyNotFoundException(
                "No se encontró la práctica profesional solicitada.");
        }

        practica.DocumentoId = null;

        _practicaRepository.Actualizar(practica);
        await _practicaRepository.GuardarCambiosAsync();

        _practicaRepository.Eliminar(practica);
        await _practicaRepository.GuardarCambiosAsync();
    }


    private async Task ValidarDocumentoAsync(
        int? documentoId,
        int usuarioId)
    {
        if (!documentoId.HasValue)
        {
            return;
        }

        if (documentoId.Value <= 0)
        {
            throw new ArgumentException(
                "El identificador del documento debe ser mayor que cero.");
        }

        var documento = await _documentoRepository
            .ObtenerPorIdYUsuarioAsync(documentoId.Value, usuarioId);

        if (documento is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el documento solicitado para este usuario.");
        }

        if (documento.Estado != EstadoDocumento.Activo)
        {
            throw new InvalidOperationException(
                "No se puede asociar un documento que no esté activo.");
        }
        if (documento.TipoDocumento != TipoDocumento.Constancia &&
    documento.TipoDocumento != TipoDocumento.ConstanciaLaboral)
        {
            throw new InvalidOperationException(
                "Una práctica profesional solo puede asociarse a una constancia " +
                "o constancia laboral.");
        }
    }

    private static void ValidarDatos(
        string empresa,
        string puesto,
        string? institucionEducativa,
        string? descripcion,
        DateOnly fechaInicio,
        DateOnly? fechaFin,
        bool enCurso,
        int? horasRealizadas)
    {
        if (string.IsNullOrWhiteSpace(empresa))
        {
            throw new ArgumentException(
                "El nombre de la empresa es obligatorio.");
        }

        if (empresa.Trim().Length > 150)
        {
            throw new ArgumentException(
                "El nombre de la empresa no puede superar los 150 caracteres.");
        }

        if (string.IsNullOrWhiteSpace(puesto))
        {
            throw new ArgumentException(
                "El puesto es obligatorio.");
        }

        if (puesto.Trim().Length > 150)
        {
            throw new ArgumentException(
                "El puesto no puede superar los 150 caracteres.");
        }

        if (institucionEducativa?.Trim().Length > 150)
        {
            throw new ArgumentException(
                "La institución educativa no puede superar los 150 caracteres.");
        }

        if (descripcion?.Length > 1000)
        {
            throw new ArgumentException(
                "La descripción no puede superar los 1000 caracteres.");
        }

        if (fechaFin.HasValue && fechaFin.Value < fechaInicio)
        {
            throw new ArgumentException(
                "La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }

        if (enCurso && fechaFin.HasValue)
        {
            throw new ArgumentException(
                "Una práctica en curso no debe tener fecha de finalización.");
        }

        if (horasRealizadas.HasValue && horasRealizadas.Value < 0)
        {
            throw new ArgumentException(
                "Las horas realizadas no pueden ser negativas.");
        }
    }

    private static void ValidarPracticaId(int id)
    {
        if (id <= 0)
        {
            throw new ArgumentException(
                "El identificador de la práctica debe ser mayor que cero.");
        }
    }

    private static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new ArgumentException(
                "El identificador del usuario debe ser mayor que cero.");
        }
    }

    private static string? NormalizarTexto(string? valor)
    {
        return string.IsNullOrWhiteSpace(valor)
            ? null
            : valor.Trim();
    }

    private static PracticaResponseDto MapearRespuesta(
        PracticaProfesional practica)
    {
        return new PracticaResponseDto
        {
            Id = practica.Id,
            UsuarioId = practica.UsuarioId,
            Empresa = practica.Empresa,
            Puesto = practica.Puesto,
            InstitucionEducativa = practica.InstitucionEducativa,
            Descripcion = practica.Descripcion,
            FechaInicio = practica.FechaInicio,
            FechaFin = practica.FechaFin,
            EnCurso = !practica.FechaFin.HasValue,
            HorasRealizadas = practica.HorasRealizadas,
            DocumentoId = practica.DocumentoId
        };
    }
}
