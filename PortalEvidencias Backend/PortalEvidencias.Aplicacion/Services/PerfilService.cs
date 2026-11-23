
using PortalEvidencias.Aplicacion.DTOs.Perfil;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Validators;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class PerfilService : IPerfilService
{
    private readonly IPerfilRepository _perfilRepository;
    private readonly IDocumentoRepository _documentoRepository;

    public PerfilService(
        IPerfilRepository perfilRepository,
        IDocumentoRepository documentoRepository)
    {
        _perfilRepository = perfilRepository;
        _documentoRepository = documentoRepository;
    }

    public async Task<PerfilResponseDto?> ObtenerPorUsuarioAsync(
        int usuarioId)
    {
        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(
            usuarioId);

        return perfil is null ? null : MapearRespuesta(perfil);
    }

    public async Task<PerfilResponseDto> ActualizarAsync(
        int usuarioId,
        ActualizarPerfilRequestDto dto)
    {
        // Validamos los datos antes de modificar el perfil.
        PerfilValidator.Validar(dto);

        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(
            usuarioId);

        if (perfil is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el perfil del usuario.");
        }

        // Actualizamos los nombres y apellidos por separado.
        if (dto.Nombres is not null)
        {
            perfil.Nombres = dto.Nombres.Trim();
        }

        if (dto.ApellidoPaterno is not null)
        {
            perfil.ApellidoPaterno = dto.ApellidoPaterno.Trim();
        }

        if (dto.ApellidoMaterno is not null)
        {
            perfil.ApellidoMaterno = dto.ApellidoMaterno.Trim();
        }

        if (dto.Telefono is not null)
        {
            perfil.Telefono = dto.Telefono.Trim();
        }
        
        if (dto.Biografia is not null)
        {
            perfil.Biografia = dto.Biografia.Trim();
        }

        if (dto.EliminarFechaNacimiento)
        {
            perfil.FechaNacimiento = null;
        }
        else if (dto.FechaNacimiento.HasValue)
        {
            perfil.FechaNacimiento = dto.FechaNacimiento;
        }

        if (dto.Curp is not null)
        {
            perfil.Curp = dto.Curp.Trim().ToUpperInvariant();
        }

        perfil.FechaActualizacion = DateTime.UtcNow;

        _perfilRepository.Actualizar(perfil);
        await _perfilRepository.GuardarCambiosAsync();

        return MapearRespuesta(perfil);
    }

    public async Task<PerfilResponseDto> ActualizarFotografiaAsync(
        int usuarioId,
        byte[] contenido)
    {
        ArgumentNullException.ThrowIfNull(contenido);

        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(
            usuarioId);

        if (perfil is null)
        {
            throw new KeyNotFoundException(
                "No se encontró el perfil del usuario.");
        }

        await GuardarFotografiaAsync(perfil, usuarioId, contenido);

        perfil.FechaActualizacion = DateTime.UtcNow;

        _perfilRepository.Actualizar(perfil);
        await _perfilRepository.GuardarCambiosAsync();

        return MapearRespuesta(perfil);
    }

    public async Task<FotografiaPerfilResponseDto?> ObtenerFotografiaAsync(
        int usuarioId)
    {
        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(
            usuarioId);

        if (perfil is null ||
            !perfil.DocumentoFotografiaId.HasValue)
        {
            return null;
        }

        var documento =
            await _documentoRepository.ObtenerPorIdYUsuarioAsync(
                perfil.DocumentoFotografiaId.Value,
                usuarioId);

        if (documento is null ||
            documento.TipoDocumento != TipoDocumento.FotografiaPerfil ||
            documento.Estado != EstadoDocumento.Activo)
        {
            return null;
        }

        return new FotografiaPerfilResponseDto
        {
            Contenido = documento.Contenido,
            TipoContenido = documento.TipoContenido
        };
    }

    private async Task GuardarFotografiaAsync(
        Perfil perfil,
        int usuarioId,
        byte[] contenido)
    {
        const int tamanoMaximo = 5 * 1024 * 1024;

        if (contenido.Length == 0)
        {
            throw new ArgumentException(
                "La fotografía no puede estar vacía.");
        }

        if (contenido.Length > tamanoMaximo)
        {
            throw new ArgumentException(
                "La fotografía no puede superar los 5 MB.");
        }

        // Detectamos el tipo real mediante la firma del archivo.
        string tipoContenido = ObtenerTipoImagen(contenido);

        Documento? documento = null;

        if (perfil.DocumentoFotografiaId.HasValue)
        {
            documento =
                await _documentoRepository.ObtenerPorIdYUsuarioAsync(
                    perfil.DocumentoFotografiaId.Value,
                    usuarioId);
        }

        if (documento is null)
        {
            documento = new Documento
            {
                UsuarioId = usuarioId,
                NombreArchivo = "fotografia-perfil",
                TipoContenido = tipoContenido,
                TamanoBytes = contenido.Length,
                TipoDocumento = TipoDocumento.FotografiaPerfil,
                Estado = EstadoDocumento.Activo,
                Contenido = contenido,
                FechaCarga = DateTime.UtcNow
            };

            await _documentoRepository.AgregarAsync(documento);
            await _documentoRepository.GuardarCambiosAsync();

            perfil.DocumentoFotografiaId = documento.Id;
        }
        else
        {
            documento.NombreArchivo = "fotografia-perfil";
            documento.TipoContenido = tipoContenido;
            documento.TamanoBytes = contenido.Length;
            documento.Contenido = contenido;
            documento.Estado = EstadoDocumento.Activo;
            documento.FechaActualizacion = DateTime.UtcNow;

            _documentoRepository.Actualizar(documento);
            await _documentoRepository.GuardarCambiosAsync();
        }

        perfil.FotografiaUrl = null;
    }

    private static string ObtenerTipoImagen(byte[] contenido)
    {
        // JPEG
        if (contenido.Length >= 3 &&
            contenido[0] == 0xFF &&
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

        throw new ArgumentException(
            "La fotografía debe ser una imagen JPEG, PNG o WebP válida.");
    }

    private static PerfilResponseDto MapearRespuesta(Perfil perfil)
    {
        string nombreCompleto = string.Join(" ", new[]
        {
            perfil.Nombres,
            perfil.ApellidoPaterno,
            perfil.ApellidoMaterno
        }.Where(parte => !string.IsNullOrWhiteSpace(parte)));

        return new PerfilResponseDto
        {
            Id = perfil.Id,
            UsuarioId = perfil.UsuarioId,
            Nombres = perfil.Nombres,
            ApellidoPaterno = perfil.ApellidoPaterno,
            ApellidoMaterno = perfil.ApellidoMaterno,
            NombreCompleto = nombreCompleto,
            Telefono = perfil.Telefono,
            Biografia = perfil.Biografia,
            FechaNacimiento = perfil.FechaNacimiento,
            Curp = perfil.Curp,
            RutaFotografia = perfil.FotografiaUrl
        };
    }
}
