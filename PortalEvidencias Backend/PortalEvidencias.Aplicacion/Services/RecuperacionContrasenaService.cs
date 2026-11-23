
using System.Security.Cryptography;
using System.Text;
using PortalEvidencias.Aplicacion.DTOs.Auth;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Security;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class RecuperacionContrasenaService : IRecuperacionContrasenaService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly ISolicitudRecuperacionContrasenaRepository _recuperacionRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IEmailService _emailService;

    private const int DuracionCodigoMinutos = 10;
    private const int DuracionTokenMinutos = 10;
    private const int MaximoIntentos = 5;
    private const int TiempoEntreEnviosSegundos = 60;

    public RecuperacionContrasenaService(
        IUsuarioRepository usuarioRepository,
        ISolicitudRecuperacionContrasenaRepository recuperacionRepository,
        IPasswordHasher passwordHasher,
        IEmailService emailService)
    {
        _usuarioRepository = usuarioRepository;
        _recuperacionRepository = recuperacionRepository;
        _passwordHasher = passwordHasher;
        _emailService = emailService;
    }

    public async Task SolicitarRecuperacionAsync(
        SolicitarRecuperacionDto dto)
    {
        string correo = dto.Correo.Trim().ToLowerInvariant();

        var usuario = await _usuarioRepository.ObtenerPorCorreoAsync(correo);

        // No revelamos si el correo está registrado.
        if (usuario == null || !usuario.Activo)
            return;

        var solicitudAnterior =
            await _recuperacionRepository.ObtenerUltimaPorUsuarioAsync(
                usuario.Id);

        DateTime ahora = DateTime.UtcNow;

        if (solicitudAnterior != null &&
            solicitudAnterior.FechaUltimoEnvio.HasValue &&
            (ahora - solicitudAnterior.FechaUltimoEnvio.Value).TotalSeconds
                < TiempoEntreEnviosSegundos &&
            solicitudAnterior.Estado == EstadoRecuperacion.Pendiente)
        {
            return;
        }

        string codigo = GenerarCodigo();

        var solicitud = new SolicitudRecuperacionContrasena
        {
            UsuarioId = usuario.Id,
            CodigoHash = _passwordHasher.HashPassword(codigo),
            FechaExpiracionCodigo = ahora.AddMinutes(
                DuracionCodigoMinutos),
            FechaUltimoEnvio = ahora,
            IntentosFallidos = 0,
            Estado = EstadoRecuperacion.Pendiente,
            FechaCreacion = ahora
        };

        await _recuperacionRepository.AgregarAsync(solicitud);
        await _recuperacionRepository.GuardarCambiosAsync();

        await _emailService.EnviarCodigoRecuperacionAsync(
            usuario.Correo,
            codigo);
    }

    public async Task ReenviarCodigoAsync(
        SolicitarRecuperacionDto dto)
    {
        string correo = dto.Correo.Trim().ToLowerInvariant();

        var usuario = await _usuarioRepository.ObtenerPorCorreoAsync(correo);

        if (usuario == null || !usuario.Activo)
            return;

        var solicitud =
            await _recuperacionRepository.ObtenerUltimaPorUsuarioAsync(
                usuario.Id);

        if (solicitud == null ||
            solicitud.Estado != EstadoRecuperacion.Pendiente)
            return;

        DateTime ahora = DateTime.UtcNow;

        if (solicitud.FechaUltimoEnvio.HasValue &&
            (ahora - solicitud.FechaUltimoEnvio.Value).TotalSeconds
                < TiempoEntreEnviosSegundos)
        {
            return;
        }

        string codigo = GenerarCodigo();

        solicitud.CodigoHash = _passwordHasher.HashPassword(codigo);
        solicitud.FechaExpiracionCodigo =
            ahora.AddMinutes(DuracionCodigoMinutos);
        solicitud.FechaUltimoEnvio = ahora;

        _recuperacionRepository.Actualizar(solicitud);
        await _recuperacionRepository.GuardarCambiosAsync();

        await _emailService.EnviarCodigoRecuperacionAsync(
            usuario.Correo,
            codigo);
    }

    public async Task<VerificarCodigoRecuperacionResponseDto>
        VerificarCodigoAsync(VerificarCodigoRecuperacionDto dto)
    {
        string correo = dto.Correo.Trim().ToLowerInvariant();

        var usuario = await _usuarioRepository.ObtenerPorCorreoAsync(correo);

        if (usuario == null || !usuario.Activo)
            throw new InvalidOperationException(
                "El código no es válido o ha expirado.");

        var solicitud =
            await _recuperacionRepository.ObtenerUltimaPorUsuarioAsync(
                usuario.Id);

        if (solicitud == null ||
            solicitud.Estado != EstadoRecuperacion.Pendiente)
        {
            throw new InvalidOperationException(
                "El código no es válido o ha expirado.");
        }

        DateTime ahora = DateTime.UtcNow;

        if (ahora > solicitud.FechaExpiracionCodigo)
        {
            solicitud.Estado = EstadoRecuperacion.Expirada;

            _recuperacionRepository.Actualizar(solicitud);
            await _recuperacionRepository.GuardarCambiosAsync();

            throw new InvalidOperationException(
                "El código no es válido o ha expirado.");
        }

        if (solicitud.IntentosFallidos >= MaximoIntentos)
        {
            solicitud.Estado = EstadoRecuperacion.Bloqueada;

            _recuperacionRepository.Actualizar(solicitud);
            await _recuperacionRepository.GuardarCambiosAsync();

            throw new InvalidOperationException(
                "Se ha superado el número máximo de intentos.");
        }

        bool codigoValido = _passwordHasher.VerifyPassword(
            dto.Codigo.Trim(),
            solicitud.CodigoHash);

        if (!codigoValido)
        {
            solicitud.IntentosFallidos++;

            if (solicitud.IntentosFallidos >= MaximoIntentos)
                solicitud.Estado = EstadoRecuperacion.Bloqueada;

            _recuperacionRepository.Actualizar(solicitud);
            await _recuperacionRepository.GuardarCambiosAsync();

            throw new InvalidOperationException(
                "El código no es válido o ha expirado.");
        }

        string token = GenerarTokenRestablecimiento();

        DateTime expiracionToken =
            ahora.AddMinutes(DuracionTokenMinutos);

        solicitud.Estado = EstadoRecuperacion.Verificada;
        solicitud.FechaVerificacion = ahora;
        solicitud.TokenRestablecimientoHash = CalcularHash(token);
        solicitud.FechaExpiracionToken = expiracionToken;
        solicitud.CodigoHash = string.Empty;

        _recuperacionRepository.Actualizar(solicitud);
        await _recuperacionRepository.GuardarCambiosAsync();

        return new VerificarCodigoRecuperacionResponseDto
        {
            TokenRestablecimiento = token,
            FechaExpiracion = expiracionToken
        };
    }

    public async Task RestablecerContrasenaAsync(
        RestablecerContrasenaDto dto)
    {
        if (dto.NuevaContrasena != dto.ConfirmarContrasena)
            throw new InvalidOperationException(
                "Las contraseñas no coinciden.");

        string tokenHash = CalcularHash(
            dto.TokenRestablecimiento);

        var solicitud =
            await _recuperacionRepository.ObtenerPorTokenHashAsync(
                tokenHash);

        if (solicitud == null ||
            solicitud.Estado != EstadoRecuperacion.Verificada ||
            !solicitud.FechaExpiracionToken.HasValue ||
            DateTime.UtcNow > solicitud.FechaExpiracionToken.Value)
        {
            throw new InvalidOperationException(
                "El enlace de recuperación no es válido o ha expirado.");
        }

        var usuario = await _usuarioRepository.ObtenerPorIdAsync(
            solicitud.UsuarioId);

        if (usuario == null || !usuario.Activo)
            throw new InvalidOperationException(
                "No se pudo completar la recuperación de la contraseña.");

        usuario.PasswordHash =
            _passwordHasher.HashPassword(dto.NuevaContrasena);

        usuario.FechaActualizacion = DateTime.UtcNow;

        solicitud.Estado = EstadoRecuperacion.Completada;
        solicitud.FechaCompletada = DateTime.UtcNow;

        // Invalidamos el token para impedir su reutilización.
        solicitud.TokenRestablecimientoHash = null;
        solicitud.FechaExpiracionToken = null;

        _recuperacionRepository.Actualizar(solicitud);

        await _recuperacionRepository.GuardarCambiosAsync();
    }

    private static string GenerarCodigo()
    {
        return RandomNumberGenerator
            .GetInt32(0, 1_000_000)
            .ToString("D6");
    }

    private static string GenerarTokenRestablecimiento()
    {
        byte[] bytes = RandomNumberGenerator.GetBytes(32);

        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .Replace("=", "");
    }

    private static string CalcularHash(string valor)
    {
        byte[] bytes = Encoding.UTF8.GetBytes(valor);
        byte[] hash = SHA256.HashData(bytes);

        return Convert.ToHexString(hash);
    }
}
