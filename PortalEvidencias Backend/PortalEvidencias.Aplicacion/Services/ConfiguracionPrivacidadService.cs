using System.Text.Json;
using PortalEvidencias.Aplicacion.DTOs.Privacidad;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class ConfiguracionPrivacidadService
    : IConfiguracionPrivacidadService
{
    private readonly IConfiguracionPrivacidadRepository _repository;
    private readonly IDocumentoRepository _documentoRepository;

    private static readonly HashSet<TipoDocumento> TiposPrivados =
    [
        TipoDocumento.CURP,
        TipoDocumento.INE,
        TipoDocumento.ActaNacimiento
    ];

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    public ConfiguracionPrivacidadService(
        IConfiguracionPrivacidadRepository repository,
        IDocumentoRepository documentoRepository)
    {
        _repository = repository;
        _documentoRepository = documentoRepository;
    }

    public async Task<ConfiguracionPrivacidadDto> ObtenerAsync(
        int usuarioId)
    {
        ValidarUsuarioId(usuarioId);

        var configuracion = await _repository
            .ObtenerPorUsuarioAsync(usuarioId);

        if (configuracion is null)
        {
            return new ConfiguracionPrivacidadDto();
        }

        var documentos = JsonSerializer.Deserialize<List<int>>(
            configuracion.DocumentosPublicosJson,
            JsonOptions) ?? [];

        return new ConfiguracionPrivacidadDto
        {
            DocumentosPublicos = documentos
        };
    }

    public async Task<ConfiguracionPrivacidadDto> ActualizarAsync(
        int usuarioId,
        ActualizarPrivacidadRequestDto dto)
    {
        ValidarUsuarioId(usuarioId);

        ArgumentNullException.ThrowIfNull(dto);

        if (dto.DocumentosPublicos is null)
        {
            throw new ArgumentException(
                "La lista de documentos públicos es obligatoria.");
        }

        if (dto.DocumentosPublicos.Any(id => id <= 0))
        {
            throw new ArgumentException(
                "La lista contiene identificadores de documentos inválidos.");
        }

        var documentosUnicos = dto.DocumentosPublicos
            .Distinct()
            .ToList();

        foreach (int documentoId in documentosUnicos)
        {
            var documento = await _documentoRepository
                .ObtenerPorIdYUsuarioAsync(documentoId, usuarioId);

            if (documento is null ||
                documento.Estado != EstadoDocumento.Activo)
            {
                throw new InvalidOperationException(
                    $"El documento {documentoId} no existe o no pertenece al usuario.");
            }

            if (TiposPrivados.Contains(documento.TipoDocumento))
            {
                throw new InvalidOperationException(
                    $"El documento {documentoId} es de tipo privado y no puede publicarse.");
            }
        }

        var configuracion = await _repository
            .ObtenerPorUsuarioAsync(usuarioId);

        string documentosJson = JsonSerializer.Serialize(
            documentosUnicos,
            JsonOptions);

        if (configuracion is null)
        {
            configuracion = new ConfiguracionPrivacidad
            {
                UsuarioId = usuarioId,
                DocumentosPublicosJson = documentosJson,
                FechaCreacion = DateTime.UtcNow
            };

            await _repository.AgregarAsync(configuracion);
        }
        else
        {
            configuracion.DocumentosPublicosJson = documentosJson;
            configuracion.FechaActualizacion = DateTime.UtcNow;

            _repository.Actualizar(configuracion);
        }

        await _repository.GuardarCambiosAsync();

        return new ConfiguracionPrivacidadDto
        {
            DocumentosPublicos = documentosUnicos
        };
    }

    public async Task<bool> DocumentoEstaAutorizadoAsync(
        int usuarioId,
        int documentoId)
    {
        if (usuarioId <= 0 || documentoId <= 0)
        {
            return false;
        }

        var documento = await _documentoRepository
            .ObtenerPorIdYUsuarioAsync(documentoId, usuarioId);

        if (documento is null ||
            documento.Estado != EstadoDocumento.Activo ||
            TiposPrivados.Contains(documento.TipoDocumento))
        {
            return false;
        }

        var configuracion = await _repository
            .ObtenerPorUsuarioAsync(usuarioId);

        if (configuracion is null)
        {
            return false;
        }

        var documentos = JsonSerializer.Deserialize<List<int>>(
            configuracion.DocumentosPublicosJson,
            JsonOptions) ?? [];

        return documentos.Contains(documentoId);
    }

    private static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new ArgumentException(
                "El identificador del usuario no es válido.");
        }
    }
}