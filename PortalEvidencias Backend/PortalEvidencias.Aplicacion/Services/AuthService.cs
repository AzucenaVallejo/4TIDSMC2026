
using PortalEvidencias.Aplicacion.DTOs.Auth;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Security;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Validators;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Services;

public class AuthService : IAuthService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPerfilRepository _perfilRepository;
    private readonly ICuentaExternaRepository _cuentaExternaRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ITokenService _tokenService;
    private readonly IGoogleIdentityService _googleIdentityService;

    public AuthService(
        IUsuarioRepository usuarioRepository,
        IPerfilRepository perfilRepository,
        ICuentaExternaRepository cuentaExternaRepository,
        IRefreshTokenRepository refreshTokenRepository,
        IPasswordHasher passwordHasher,
        ITokenService tokenService,
        IGoogleIdentityService googleIdentityService)
    {
        _usuarioRepository = usuarioRepository;
        _perfilRepository = perfilRepository;
        _cuentaExternaRepository = cuentaExternaRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _passwordHasher = passwordHasher;
        _tokenService = tokenService;
        _googleIdentityService = googleIdentityService;
    }

    public async Task<AuthResponseDto> RegistrarAsync(
        RegistroRequestDto dto)
    {
        RegistroValidator.Validar(dto);

        string correo = dto.Correo.Trim().ToLowerInvariant();

        if (await _usuarioRepository.ExisteCorreoAsync(correo))
        {
            throw new InvalidOperationException(
                "Ya existe una cuenta registrada con ese correo.");
        }

        var usuario = new Usuario
        {
            Correo = correo,
            PasswordHash = _passwordHasher.HashPassword(dto.Contrasena),
            CorreoVerificado = false,
            Activo = true,
            FechaCreacion = DateTime.UtcNow
        };

        await _usuarioRepository.AgregarAsync(usuario);
        await _usuarioRepository.GuardarCambiosAsync();


        var perfil = new Perfil
        {
            UsuarioId = usuario.Id,
            Nombres = dto.Nombres.Trim(),
            ApellidoPaterno = dto.ApellidoPaterno.Trim(),
            ApellidoMaterno = dto.ApellidoMaterno.Trim()
        };

        await _perfilRepository.AgregarAsync(perfil);
        await _perfilRepository.GuardarCambiosAsync();


        return await CrearRespuestaAutenticacionAsync(usuario);
    }

    public async Task<AuthResponseDto> IniciarSesionAsync(
        LoginRequestDto dto)
    {
        LoginValidator.Validar(dto);

        string correo = dto.Correo.Trim().ToLowerInvariant();

        var usuario = await _usuarioRepository.ObtenerPorCorreoAsync(
            correo);

        if (usuario is null ||
            !_passwordHasher.VerifyPassword(
                dto.Contrasena,
                usuario.PasswordHash))
        {
            throw new InvalidOperationException(
                "El correo o la contraseña son incorrectos.");
        }

        if (!usuario.Activo)
        {
            throw new InvalidOperationException(
                "La cuenta está desactivada.");
        }

        return await CrearRespuestaAutenticacionAsync(usuario);
    }

    public async Task<AuthResponseDto> IniciarSesionGoogleAsync(
        GoogleLoginRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.IdToken))
        {
            throw new ArgumentException(
                "El token de Google es obligatorio.");
        }

        var identidad = await _googleIdentityService.ValidarIdTokenAsync(
            dto.IdToken);

        if (identidad is null)
        {
            throw new InvalidOperationException(
                "El token de Google no es válido.");
        }

        if (!identidad.CorreoVerificado)
        {
            throw new InvalidOperationException(
                "La cuenta de Google no tiene un correo verificado.");
        }

        if (string.IsNullOrWhiteSpace(identidad.Correo) ||
            string.IsNullOrWhiteSpace(identidad.IdentificadorExterno))
        {
            throw new InvalidOperationException(
                "Google no proporcionó los datos de identidad necesarios.");
        }

        string correo = identidad.Correo.Trim().ToLowerInvariant();

        var cuentaExterna =
            await _cuentaExternaRepository
                .ObtenerPorProveedorEIdentificadorAsync(
                    ProveedorAutenticacion.Google,
                    identidad.IdentificadorExterno);

        Usuario? usuario;

        if (cuentaExterna is not null)
        {
            usuario = await _usuarioRepository.ObtenerPorIdAsync(
                cuentaExterna.UsuarioId);

            if (usuario is null)
            {
                throw new InvalidOperationException(
                    "La cuenta externa no tiene un usuario asociado.");
            }
        }
        else
        {
            usuario = await _usuarioRepository.ObtenerPorCorreoAsync(
                correo);

            if (usuario is null)
            {
                usuario = new Usuario
                {
                    Correo = correo,
                    PasswordHash = _passwordHasher.HashPassword(
                        Guid.NewGuid().ToString("N")),
                    CorreoVerificado = true,
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                };

                await _usuarioRepository.AgregarAsync(usuario);
                await _usuarioRepository.GuardarCambiosAsync();
            }
            else
            {
                usuario.CorreoVerificado = true;
                usuario.FechaActualizacion = DateTime.UtcNow;

                await _usuarioRepository.GuardarCambiosAsync();
            }

            cuentaExterna = new CuentaExterna
            {
                UsuarioId = usuario.Id,
                Proveedor = ProveedorAutenticacion.Google,
                IdentificadorExterno = identidad.IdentificadorExterno,
                CorreoProveedor = correo,
                FechaVinculacion = DateTime.UtcNow
            };

            await _cuentaExternaRepository.AgregarAsync(cuentaExterna);
            await _cuentaExternaRepository.GuardarCambiosAsync();
        }

        if (!usuario.Activo)
        {
            throw new InvalidOperationException(
                "La cuenta está desactivada.");
        }

        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(
            usuario.Id);

        if (perfil is null)
        {
            perfil = new Perfil
            {
                UsuarioId = usuario.Id,
                Nombres = identidad.Nombre ?? string.Empty
            };

            await _perfilRepository.AgregarAsync(perfil);
            await _perfilRepository.GuardarCambiosAsync();
        }

        return await CrearRespuestaAutenticacionAsync(usuario);
    }


    public async Task<AuthResponseDto> RenovarTokenAsync(
        RefreshTokenRequestDto dto)
    {
        ValidarRefreshToken(dto);

        string tokenHash = _tokenService.CalcularHashRefreshToken(
            dto.RefreshToken);

        var tokenActual =
            await _refreshTokenRepository.ObtenerPorHashAsync(tokenHash);

        if (tokenActual is null || !tokenActual.EstaActivo)
        {
            throw new InvalidOperationException(
                "El refresh token no es válido, expiró o fue revocado.");
        }

        var usuario = await _usuarioRepository.ObtenerPorIdAsync(
            tokenActual.UsuarioId);

        if (usuario is null || !usuario.Activo)
        {
            throw new InvalidOperationException(
                "La cuenta asociada al token no está disponible.");
        }

        DateTime ahora = DateTime.UtcNow;

        // La revocación condicional evita consumir el mismo token dos veces.
        bool revocado = await _refreshTokenRepository.RevocarSiActivoAsync(
            tokenHash,
            ahora,
            "Renovación del token");

        if (!revocado)
        {
            throw new InvalidOperationException(
                "El refresh token ya fue utilizado, expiró o fue revocado.");
        }

        // Solo después de revocarlo se genera una nueva sesión.
        return await CrearRespuestaAutenticacionAsync(usuario);
    }

    public async Task CerrarSesionAsync(RefreshTokenRequestDto dto)
    {
        ValidarRefreshToken(dto);

        string tokenHash = _tokenService.CalcularHashRefreshToken(
            dto.RefreshToken);

        // Si ya está revocado o expiró, no se vuelve a modificar.
        await _refreshTokenRepository.RevocarSiActivoAsync(
            tokenHash,
            DateTime.UtcNow,
            "Cierre de sesión");
    }


    private static void ValidarRefreshToken(
        RefreshTokenRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.RefreshToken))
        {
            throw new ArgumentException(
                "El refresh token es obligatorio.");
        }
    }

    private async Task<AuthResponseDto> CrearRespuestaAutenticacionAsync(
        Usuario usuario)
    {
        string refreshToken = _tokenService.GenerarRefreshToken();

        var registroRefreshToken = new RefreshToken
        {
            UsuarioId = usuario.Id,
            TokenHash = _tokenService.CalcularHashRefreshToken(
                refreshToken),
            FechaCreacion = DateTime.UtcNow,
            FechaExpiracion =
                _tokenService.ObtenerExpiracionRefreshToken()
        };

        await _refreshTokenRepository.AgregarAsync(registroRefreshToken);
        await _refreshTokenRepository.GuardarCambiosAsync();

        var perfil = await _perfilRepository.ObtenerPorUsuarioIdAsync(
            usuario.Id);

        string nombre = perfil is null
            ? string.Empty
            : string.Join(" ", new[]
            {
                perfil.Nombres,
                perfil.ApellidoPaterno,
                perfil.ApellidoMaterno
            }.Where(parte =>
                !string.IsNullOrWhiteSpace(parte)));

        return new AuthResponseDto
        {
            UsuarioId = usuario.Id,
            Nombre = nombre,
            Correo = usuario.Correo,
            AccessToken = _tokenService.GenerarAccessToken(usuario),
            RefreshToken = refreshToken,
            ExpiraEn = _tokenService.ObtenerExpiracionAccessToken()
        };
    }
}
