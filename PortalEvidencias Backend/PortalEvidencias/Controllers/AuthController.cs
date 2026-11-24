
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PortalEvidencias.Aplicacion.DTOs.Auth;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Infraestructura.Options;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string AccessCookie = "PortalEvidencias.AccessToken";
    private const string RefreshCookie = "PortalEvidencias.RefreshToken";

    private readonly IAuthService _authService;
    private readonly IRecuperacionContrasenaService _recuperacionService;
    private readonly JwtOptions _jwtOptions;

    public AuthController(
        IAuthService authService,
        IRecuperacionContrasenaService recuperacionService,
        IOptions<JwtOptions> jwtOptions)
    {
        _authService = authService;
        _recuperacionService = recuperacionService;
        _jwtOptions = jwtOptions.Value;
    }

    [HttpPost("registro")]
    public async Task<IActionResult> Registrar(
        [FromBody] RegistroRequestDto dto)
    {
        var respuesta = await _authService.RegistrarAsync(dto);

        EstablecerCookies(respuesta);

        return Ok(RespuestaPublica(respuesta));
    }

    [HttpPost("login")]
    public async Task<IActionResult> IniciarSesion(
        [FromBody] LoginRequestDto dto)
    {
        try
        {
            var respuesta = await _authService.IniciarSesionAsync(dto);

            EstablecerCookies(respuesta);

            return Ok(RespuestaPublica(respuesta));
        }
        catch (InvalidOperationException)
        {
            return Unauthorized(new
            {
                mensaje = "No fue posible iniciar sesión con esas credenciales."
            });
        }
    }

    [HttpPost("google")]
    public async Task<IActionResult> IniciarSesionGoogle(
        [FromBody] GoogleLoginRequestDto dto)
    {
        var respuesta = await _authService.IniciarSesionGoogleAsync(dto);

        EstablecerCookies(respuesta);

        return Ok(RespuestaPublica(respuesta));
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> RenovarToken()
    {
        if (!Request.Cookies.TryGetValue(
                RefreshCookie, out string? refreshToken) ||
            string.IsNullOrWhiteSpace(refreshToken))
        {
            BorrarCookies();

            return Unauthorized(new
            {
                mensaje = "La sesión ha expirado."
            });
        }

        try
        {
            var respuesta = await _authService.RenovarTokenAsync(
                new RefreshTokenRequestDto
                {
                    RefreshToken = refreshToken
                });

            EstablecerCookies(respuesta);

            return Ok(RespuestaPublica(respuesta));
        }
        catch (InvalidOperationException)
        {
            BorrarCookies();

            return Unauthorized(new
            {
                mensaje = "La sesión ha expirado."
            });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> CerrarSesion()
    {
        if (Request.Cookies.TryGetValue(
                RefreshCookie, out string? refreshToken) &&
            !string.IsNullOrWhiteSpace(refreshToken))
        {
            await _authService.CerrarSesionAsync(
                new RefreshTokenRequestDto
                {
                    RefreshToken = refreshToken
                });
        }

        BorrarCookies();

        return NoContent();
    }

    // SOLICITAR RECUPERACIÓN DE CONTRASEÑA.
    [AllowAnonymous]
    [HttpPost("solicitar-recuperacion")]
    public async Task<IActionResult> SolicitarRecuperacion(
        [FromBody] SolicitarRecuperacionDto dto)
    {
        await _recuperacionService.SolicitarRecuperacionAsync(dto);

        return Ok(new
        {
            mensaje = "Si los datos corresponden a una cuenta válida, recibirás instrucciones para recuperar tu contraseña."
        });
    }

    // VERIFICAR CÓDIGO OTP.
    [AllowAnonymous]
    [HttpPost("verificar-codigo")]
    public async Task<IActionResult> VerificarCodigo(
        [FromBody] VerificarCodigoRecuperacionDto dto)
    {
        try
        {
            var respuesta =
                await _recuperacionService.VerificarCodigoAsync(dto);

            return Ok(respuesta);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                mensaje = ex.Message
            });
        }
    }

    // RESTABLECER CONTRASEÑA.
    [AllowAnonymous]
    [HttpPost("restablecer-contrasena")]
    public async Task<IActionResult> RestablecerContrasena(
        [FromBody] RestablecerContrasenaDto dto)
    {
        try
        {
            await _recuperacionService.RestablecerContrasenaAsync(dto);

            return Ok(new
            {
                mensaje = "La contraseña se restableció correctamente."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                mensaje = ex.Message
            });
        }
    }

    // REENVIAR CÓDIGO OTP.
    [AllowAnonymous]
    [HttpPost("reenviar-codigo")]
    public async Task<IActionResult> ReenviarCodigo(
        [FromBody] SolicitarRecuperacionDto dto)
    {
        await _recuperacionService.ReenviarCodigoAsync(dto);

        return Ok(new
        {
            mensaje = "Si la solicitud es válida, recibirás un nuevo código."
        });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult ObtenerSesion()
    {
        string? usuarioId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        string? correo =
            User.FindFirstValue(ClaimTypes.Email) ??
            User.FindFirstValue(JwtRegisteredClaimNames.Email);

        if (string.IsNullOrWhiteSpace(usuarioId))
        {
            return Unauthorized();
        }

        return Ok(new
        {
            usuarioId,
            correo
        });
    }

    private void EstablecerCookies(AuthResponseDto respuesta)
    {
        var expiracionAccess = new DateTimeOffset(
            DateTime.SpecifyKind(
                respuesta.ExpiraEn,
                DateTimeKind.Utc));

        Response.Cookies.Append(
            AccessCookie,
            respuesta.AccessToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/",
                Expires = expiracionAccess,
                IsEssential = true
            });

        Response.Cookies.Append(
            RefreshCookie,
            respuesta.RefreshToken,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/api/Auth",
                Expires = DateTimeOffset.UtcNow.AddDays(
                    _jwtOptions.RefreshTokenExpirationDays),
                IsEssential = true
            });
    }

    private void BorrarCookies()
    {
        Response.Cookies.Delete(
            AccessCookie,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/"
            });

        Response.Cookies.Delete(
            RefreshCookie,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/api/Auth"
            });
    }

    private static object RespuestaPublica(AuthResponseDto respuesta)
    {
        // Nunca devolver AccessToken ni RefreshToken al frontend.
        return new
        {
            usuarioId = respuesta.UsuarioId,
            nombre = respuesta.Nombre,
            correo = respuesta.Correo,
            expiraEn = respuesta.ExpiraEn
        };
    }
}
