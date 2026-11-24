
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PortalEvidencias.Aplicacion.DTOs.Formacion;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Validators;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class FormacionService : IFormacionService
{
    private readonly IFormacionRepository _formacionRepository;
    private readonly IDocumentoRepository _documentoRepository;

    public FormacionService(
        IFormacionRepository formacionRepository,
        IDocumentoRepository documentoRepository)
    {
        _formacionRepository = formacionRepository;
        _documentoRepository = documentoRepository;
    }

    public async Task<List<FormacionResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        FormacionValidator.ValidarUsuarioId(usuarioId);

        var formaciones =
            await _formacionRepository.ObtenerPorUsuarioAsync(usuarioId);

        return formaciones.Select(MapearRespuesta).ToList();
    }

    public async Task<FormacionResponseDto?> ObtenerPorIdAsync(
        int id,
        int usuarioId)
    {
        FormacionValidator.ValidarIdentificadores(id, usuarioId);

        var formacion =
            await _formacionRepository.ObtenerPorIdYUsuarioAsync(id, usuarioId);

        return formacion is null
            ? null
            : MapearRespuesta(formacion);
    }

    public async Task<FormacionResponseDto> CrearAsync(
        int usuarioId,
        CrearFormacionRequestDto dto)
    {
        FormacionValidator.ValidarUsuarioId(usuarioId);
        FormacionValidator.Validar(dto);

        var nivel = FormacionValidator.ConvertirNivel(dto.NivelEducativo);

        var formacion = new FormacionAcademica
        {
            UsuarioId = usuarioId,
            Institucion = dto.Institucion.Trim(),
            Nivel = nivel,
            NombrePrograma = dto.Carrera?.Trim() ?? string.Empty,
            Descripcion = NormalizarDescripcion(dto.Descripcion),
            FechaInicio = dto.FechaInicio,
            FechaFin = dto.EnCurso ? null : dto.FechaFin,
            EnCurso = dto.EnCurso,
            FechaCreacion = DateTime.UtcNow
        };

        if (dto.EnCurso)
        {
            formacion.DocumentoCertificadoId = null;
            formacion.DocumentoTituloId = null;
        }
        else
        {
            await AsociarDocumentoAsync(
                formacion,
                dto.DocumentoCertificadoId,
                usuarioId,
                esCertificado: true);

            await AsociarDocumentoAsync(
                formacion,
                dto.DocumentoTituloId,
                usuarioId,
                esCertificado: false);
        }

        await _formacionRepository.AgregarAsync(formacion);
        await _formacionRepository.GuardarCambiosAsync();

        return MapearRespuesta(formacion);
    }

    public async Task<FormacionResponseDto> ActualizarAsync(
        int id,
        int usuarioId,
        ActualizarFormacionRequestDto dto)
    {
        FormacionValidator.ValidarIdentificadores(id, usuarioId);
        FormacionValidator.Validar(dto);

        var formacion =
            await _formacionRepository.ObtenerPorIdYUsuarioAsync(id, usuarioId)
            ?? throw new KeyNotFoundException(
                "No se encontró la formación académica solicitada.");

        formacion.Institucion = dto.Institucion.Trim();
        formacion.Nivel = FormacionValidator.ConvertirNivel(dto.NivelEducativo);
        formacion.NombrePrograma = dto.Carrera?.Trim() ?? string.Empty;
        formacion.Descripcion = NormalizarDescripcion(dto.Descripcion);
        formacion.FechaInicio = dto.FechaInicio;
        formacion.FechaFin = dto.EnCurso ? null : dto.FechaFin;
        formacion.EnCurso = dto.EnCurso;
        formacion.FechaActualizacion = DateTime.UtcNow;

        if (dto.EnCurso)
        {
            // Una formación en curso no conserva documentos de finalización.
            formacion.DocumentoCertificadoId = null;
            formacion.DocumentoTituloId = null;
        }
        else
        {
            // Si se proporciona un documento nuevo, se actualiza su asociación.
            // Si llega null, se conserva la asociación anterior.
            if (dto.DocumentoCertificadoId.HasValue)
            {
                await AsociarDocumentoAsync(
                    formacion,
                    dto.DocumentoCertificadoId,
                    usuarioId,
                    esCertificado: true);
            }

            if (dto.DocumentoTituloId.HasValue)
            {
                await AsociarDocumentoAsync(
                    formacion,
                    dto.DocumentoTituloId,
                    usuarioId,
                    esCertificado: false);
            }
        }

        _formacionRepository.Actualizar(formacion);
        await _formacionRepository.GuardarCambiosAsync();

        return MapearRespuesta(formacion);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        FormacionValidator.ValidarIdentificadores(id, usuarioId);

        var formacion =
            await _formacionRepository.ObtenerPorIdYUsuarioAsync(id, usuarioId)
            ?? throw new KeyNotFoundException(
                "No se encontró la formación académica solicitada.");

        _formacionRepository.Eliminar(formacion);
        await _formacionRepository.GuardarCambiosAsync();
    }

    private async Task AsociarDocumentoAsync(
        FormacionAcademica formacion,
        int? documentoId,
        int usuarioId,
        bool esCertificado)
    {
        if (!documentoId.HasValue)
            return;

        var documento = await _documentoRepository
            .ObtenerPorIdYUsuarioAsync(documentoId.Value, usuarioId);

        if (documento is null ||
            documento.Estado != EstadoDocumento.Activo)
        {
            throw new InvalidOperationException(
                "El documento no existe, no pertenece al usuario o no está activo.");
        }

        if (esCertificado)
        {
            if (documento.TipoDocumento != TipoDocumento.CertificadoPreparatoria &&
                documento.TipoDocumento != TipoDocumento.CertificadoAcademico)
            {
                throw new InvalidOperationException(
                    "El documento seleccionado debe ser un certificado académico.");
            }

            formacion.DocumentoCertificadoId = documento.Id;
        }
        else
        {
            if (documento.TipoDocumento != TipoDocumento.TituloAcademico)
            {
                throw new InvalidOperationException(
                    "El documento seleccionado debe ser un título académico.");
            }

            formacion.DocumentoTituloId = documento.Id;
        }
    }

    private static string? NormalizarDescripcion(string? descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion))
            return null;

        return descripcion.Trim();
    }

    private static FormacionResponseDto MapearRespuesta(
        FormacionAcademica formacion)
    {
        return new FormacionResponseDto
        {
            Id = formacion.Id,
            UsuarioId = formacion.UsuarioId,
            Institucion = formacion.Institucion,
            NivelEducativo = formacion.Nivel.ToString(),
            Carrera = string.IsNullOrWhiteSpace(formacion.NombrePrograma)
                ? null
                : formacion.NombrePrograma,
            Descripcion = formacion.Descripcion,
            FechaInicio = formacion.FechaInicio,
            FechaFin = formacion.FechaFin,
            EnCurso = formacion.EnCurso,
            DocumentoCertificadoId = formacion.DocumentoCertificadoId,
            DocumentoTituloId = formacion.DocumentoTituloId
        };
    }
}
