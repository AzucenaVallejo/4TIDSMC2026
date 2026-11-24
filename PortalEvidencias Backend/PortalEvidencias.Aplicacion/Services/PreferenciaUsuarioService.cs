using PortalEvidencias.Aplicacion.DTOs.Preferencias;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Validators;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Services;

public class PreferenciaUsuarioService : IPreferenciaUsuarioService
{
    private readonly IPreferenciaUsuarioRepository _repository;

    public PreferenciaUsuarioService(
        IPreferenciaUsuarioRepository repository)
    {
        _repository = repository;
    }

    public async Task<PreferenciasResponseDto> ObtenerAsync(int usuarioId)
    {
        PreferenciaUsuarioValidator.ValidarUsuarioId(usuarioId);

        var preferencia = await _repository.ObtenerPorUsuarioAsync(usuarioId);

        // Si todavía no existen preferencias, se devuelven los valores predeterminados.
        if (preferencia is null)
        {
            return MapearRespuesta(CrearPredeterminadas(usuarioId));
        }

        return MapearRespuesta(preferencia);
    }

    public async Task<PreferenciasResponseDto> ActualizarAsync(
        int usuarioId,
        ActualizarPreferenciasRequestDto dto)
    {
        PreferenciaUsuarioValidator.ValidarUsuarioId(usuarioId);
        PreferenciaUsuarioValidator.Validar(dto);

        var preferencia = await _repository.ObtenerPorUsuarioAsync(usuarioId);

        if (preferencia is null)
        {
            preferencia = CrearPredeterminadas(usuarioId);
            AplicarCambios(preferencia, dto);

            await _repository.AgregarAsync(preferencia);
        }
        else
        {
            AplicarCambios(preferencia, dto);
            _repository.Actualizar(preferencia);
        }

        preferencia.FechaActualizacion = DateTime.UtcNow;

        await _repository.GuardarCambiosAsync();

        return MapearRespuesta(preferencia);
    }

    public async Task<PreferenciasResponseDto> RestablecerAsync(
        int usuarioId)
    {
        PreferenciaUsuarioValidator.ValidarUsuarioId(usuarioId);

        var preferencia = await _repository.ObtenerPorUsuarioAsync(usuarioId);

        if (preferencia is null)
        {
            preferencia = CrearPredeterminadas(usuarioId);
            await _repository.AgregarAsync(preferencia);
        }
        else
        {
            AplicarValoresPredeterminados(preferencia);
            preferencia.FechaActualizacion = DateTime.UtcNow;
            _repository.Actualizar(preferencia);
        }

        await _repository.GuardarCambiosAsync();

        return MapearRespuesta(preferencia);
    }

    private static PreferenciaUsuario CrearPredeterminadas(int usuarioId)
    {
        return new PreferenciaUsuario
        {
            UsuarioId = usuarioId,
            FechaActualizacion = DateTime.UtcNow
        };
    }

    private static void AplicarCambios(
        PreferenciaUsuario preferencia,
        ActualizarPreferenciasRequestDto dto)
    {
        preferencia.Tema = dto.Tema.Trim().ToLowerInvariant();
        preferencia.ColorAcento = dto.ColorAcento.Trim().ToLowerInvariant();
        preferencia.TamanoTexto = dto.TamanoTexto.Trim().ToLowerInvariant();

        preferencia.ReducirAnimaciones = dto.ReducirAnimaciones;
        preferencia.DensidadCompacta = dto.DensidadCompacta;

        preferencia.NotificacionesGenerales = dto.NotificacionesGenerales;
        preferencia.RecordatoriosPerfil = dto.RecordatoriosPerfil;
        preferencia.AvisosEvidencias = dto.AvisosEvidencias;

        preferencia.Idioma = dto.Idioma.Trim().ToLowerInvariant();
        preferencia.FechaActualizacion = DateTime.UtcNow;
    }

    private static void AplicarValoresPredeterminados(
        PreferenciaUsuario preferencia)
    {
        preferencia.Tema = "auto";
        preferencia.ColorAcento = "#2563eb";
        preferencia.TamanoTexto = "medium";

        preferencia.ReducirAnimaciones = false;
        preferencia.DensidadCompacta = false;

        preferencia.NotificacionesGenerales = true;
        preferencia.RecordatoriosPerfil = true;
        preferencia.AvisosEvidencias = true;

        preferencia.Idioma = "es";
    }

    private static PreferenciasResponseDto MapearRespuesta(
        PreferenciaUsuario preferencia)
    {
        return new PreferenciasResponseDto
        {
            Id = preferencia.Id,
            Tema = preferencia.Tema,
            ColorAcento = preferencia.ColorAcento,
            TamanoTexto = preferencia.TamanoTexto,

            ReducirAnimaciones = preferencia.ReducirAnimaciones,
            DensidadCompacta = preferencia.DensidadCompacta,

            NotificacionesGenerales = preferencia.NotificacionesGenerales,
            RecordatoriosPerfil = preferencia.RecordatoriosPerfil,
            AvisosEvidencias = preferencia.AvisosEvidencias,

            Idioma = preferencia.Idioma,
            FechaActualizacion = preferencia.FechaActualizacion
        };
    }
}