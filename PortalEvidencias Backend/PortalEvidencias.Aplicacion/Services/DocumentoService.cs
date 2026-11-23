
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using PortalEvidencias.Aplicacion.DTOs.Documentos;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Validators;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class DocumentoService : IDocumentoService
{
    private readonly IDocumentoRepository _documentoRepository;
    private readonly IProyectoRepository _proyectoRepository;
    private readonly IFormacionRepository _formacionRepository;
    private readonly IActividadRepository _actividadRepository;
    private readonly IPracticaRepository _practicaRepository;

    public DocumentoService(
        IDocumentoRepository documentoRepository,
        IProyectoRepository proyectoRepository,
        IFormacionRepository formacionRepository,
        IActividadRepository actividadRepository,
        IPracticaRepository practicaRepository)
    {
        _documentoRepository = documentoRepository;
        _proyectoRepository = proyectoRepository;
        _formacionRepository = formacionRepository;
        _actividadRepository = actividadRepository;
        _practicaRepository = practicaRepository;
    }

    public async Task<DocumentoResponseDto?> ObtenerPorIdAsync(
        int documentoId,
        int usuarioId)
    {
        DocumentoValidator.ValidarIdentificadores(documentoId, usuarioId);

        var documento = await _documentoRepository
            .ObtenerPorIdYUsuarioAsync(documentoId, usuarioId);

        if (documento is null ||
            documento.Estado != EstadoDocumento.Activo)
        {
            return null;
        }

        return MapearRespuesta(documento);
    }

    public async Task<List<DocumentoResponseDto>> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        DocumentoValidator.ValidarUsuarioId(usuarioId);

        var documentos = await _documentoRepository
            .ObtenerPorUsuarioAsync(usuarioId);

        return documentos
            .Where(d => d.Estado == EstadoDocumento.Activo)
            .Select(MapearRespuesta)
            .ToList();
    }

    public async Task<List<DocumentoResponseDto>> ObtenerPorProyectoAsync(
        int proyectoId,
        int usuarioId)
    {
        DocumentoValidator.ValidarIdentificadores(proyectoId, usuarioId);

        var proyecto = await _proyectoRepository
            .ObtenerPorIdYUsuarioAsync(proyectoId, usuarioId);

        if (proyecto is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el proyecto solicitado.");
        }

        var documentos = await _documentoRepository
            .ObtenerPorProyectoAsync(proyectoId, usuarioId);

        return documentos
            .Where(d =>
                d.Estado == EstadoDocumento.Activo &&
                d.TipoDocumento == TipoDocumento.EvidenciaProyecto)
            .Select(MapearRespuesta)
            .ToList();
    }

    public async Task<DocumentoResponseDto> SubirAsync(
        int usuarioId,
        string nombreArchivo,
        string tipoContenido,
        byte[] contenido,
        TipoDocumento tipoDocumento,
        int? proyectoId = null)
    {
        DocumentoValidator.ValidarSubida(
            usuarioId,
            nombreArchivo,
            tipoContenido,
            contenido,
            tipoDocumento,
            proyectoId);

        if (proyectoId.HasValue)
        {
            var proyecto = await _proyectoRepository
                .ObtenerPorIdYUsuarioAsync(proyectoId.Value, usuarioId);

            if (proyecto is null)
            {
                throw new KeyNotFoundException(
                    "No se encontró el proyecto solicitado.");
            }

            if (tipoDocumento != TipoDocumento.EvidenciaProyecto)
            {
                throw new InvalidOperationException(
                    "Los documentos asociados a proyectos deben utilizar " +
                    "el tipo EvidenciaProyecto.");
            }
        }
        else if (tipoDocumento == TipoDocumento.EvidenciaProyecto)
        {
            throw new InvalidOperationException(
                "Una evidencia de proyecto debe estar asociada a un proyecto.");
        }

        string nombreSeguro = Path.GetFileName(nombreArchivo.Trim());

        string tipoDetectado = DetectarTipoContenido(contenido);

        if (tipoDocumento == TipoDocumento.FotografiaPerfil &&
            !tipoDetectado.StartsWith(
                "image/",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "La fotografía de perfil debe ser una imagen JPEG, PNG o WebP.");
        }

        if (!string.Equals(
            tipoContenido.Trim(),
            tipoDetectado,
            StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "El tipo de contenido declarado no coincide con el archivo.");
        }

        var documento = new Documento
        {
            UsuarioId = usuarioId,
            NombreArchivo = nombreSeguro,
            TipoContenido = tipoDetectado,
            TamanoBytes = contenido.LongLength,
            TipoDocumento = tipoDocumento,
            Estado = EstadoDocumento.Activo,
            Contenido = contenido.ToArray(),
            FechaCarga = DateTime.UtcNow,
            ProyectoId = proyectoId
        };

        await _documentoRepository.AgregarAsync(documento);
        await _documentoRepository.GuardarCambiosAsync();

        return MapearRespuesta(documento);
    }

    public async Task<DocumentoDescargaDto> DescargarAsync(
        int documentoId,
        int usuarioId)
    {
        DocumentoValidator.ValidarIdentificadores(documentoId, usuarioId);

        var documento = await _documentoRepository
            .ObtenerPorIdYUsuarioAsync(documentoId, usuarioId);

        if (documento is null ||
            documento.Estado != EstadoDocumento.Activo)
        {
            throw new KeyNotFoundException(
                "No se encontró el documento solicitado.");
        }

        return new DocumentoDescargaDto
        {
            NombreArchivo = documento.NombreArchivo,
            TipoContenido = documento.TipoContenido,
            Contenido = documento.Contenido.ToArray()
        };
    }

    public async Task EliminarAsync(int documentoId, int usuarioId)
    {
        DocumentoValidator.ValidarIdentificadores(documentoId, usuarioId);

        var documento = await _documentoRepository
            .ObtenerPorIdYUsuarioAsync(documentoId, usuarioId);

        if (documento is null ||
            documento.Estado != EstadoDocumento.Activo)
        {
            throw new KeyNotFoundException(
                "No se encontró el documento solicitado.");
        }

        bool vinculado = await _actividadRepository
            .DocumentoEstaVinculadoAsync(
                documentoId,
                proyectoActualId: documento.ProyectoId);

        if (vinculado)
        {
            throw new InvalidOperationException(
                "No se puede eliminar este documento porque está asociado " +
                "a otra entidad.");
        }

        bool asociadoAFormacion = await _formacionRepository
            .ExisteDocumentoAsociadoAsync(documentoId);

        if (asociadoAFormacion)
        {
            throw new InvalidOperationException(
                "No se puede eliminar este documento porque está asociado " +
                "a una formación académica.");
        }

        bool asociadoAPractica = await _practicaRepository
            .ExisteDocumentoAsociadoAsync(documentoId);

        if (asociadoAPractica)
        {
            throw new InvalidOperationException(
                "No se puede eliminar este documento porque está asociado " +
                "a una práctica profesional.");
        }

        documento.Estado = EstadoDocumento.Eliminado;
        documento.FechaActualizacion = DateTime.UtcNow;

        _documentoRepository.Actualizar(documento);
        await _documentoRepository.GuardarCambiosAsync();
    }

    private static string DetectarTipoContenido(byte[] contenido)
    {
        if (contenido == null || contenido.Length < 4)
        {
            throw new InvalidOperationException(
                "El archivo está vacío o no tiene un formato válido.");
        }

        // PDF
        if (contenido.Length >= 5 &&
            contenido[0] == 0x25 &&
            contenido[1] == 0x50 &&
            contenido[2] == 0x44 &&
            contenido[3] == 0x46 &&
            contenido[4] == 0x2D)
        {
            return "application/pdf";
        }

        // JPEG
        if (contenido[0] == 0xFF &&
            contenido[1] == 0xD8 &&
            contenido[2] == 0xFF)
        {
            return "image/jpeg";
        }

        // PNG
        if (contenido.Length >= 8 &&
            contenido[0] == 0x89 &&
            contenido[1] == 0x50 &&
            contenido[2] == 0x4E &&
            contenido[3] == 0x47 &&
            contenido[4] == 0x0D &&
            contenido[5] == 0x0A &&
            contenido[6] == 0x1A &&
            contenido[7] == 0x0A)
        {
            return "image/png";
        }

        // WebP
        if (contenido.Length >= 12 &&
            contenido[0] == 0x52 &&
            contenido[1] == 0x49 &&
            contenido[2] == 0x46 &&
            contenido[3] == 0x46 &&
            contenido[8] == 0x57 &&
            contenido[9] == 0x45 &&
            contenido[10] == 0x42 &&
            contenido[11] == 0x50)
        {
            return "image/webp";
        }

        throw new InvalidOperationException(
            "Formato no permitido. Utiliza un PDF o una imagen JPEG, PNG o WebP.");
    }

    private static DocumentoResponseDto MapearRespuesta(
        Documento documento)
    {
        return new DocumentoResponseDto
        {
            Id = documento.Id,
            UsuarioId = documento.UsuarioId,
            ProyectoId = documento.ProyectoId,
            NombreArchivo = documento.NombreArchivo,
            TipoContenido = documento.TipoContenido,
            TipoDocumento = documento.TipoDocumento,
            TamanoBytes = documento.TamanoBytes,
            FechaSubida = documento.FechaCarga
        };
    }
}
