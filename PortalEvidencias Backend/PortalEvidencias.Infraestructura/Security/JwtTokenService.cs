
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using PortalEvidencias.Aplicacion.Interfaces.Security;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Infraestructura.Options;

namespace PortalEvidencias.Infraestructura.Security;

public class JwtTokenService : ITokenService
{
    private readonly JwtOptions _options;
    private readonly byte[] _secretKey;

    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;

        if (string.IsNullOrWhiteSpace(_options.SecretKey))
        {
            throw new InvalidOperationException(
                "La clave secreta JWT no está configurada.");
        }

        _secretKey = Encoding.UTF8.GetBytes(_options.SecretKey);

        if (_secretKey.Length < 32)
        {
            throw new InvalidOperationException(
                "La clave JWT debe tener al menos 32 bytes.");
        }

        if (string.IsNullOrWhiteSpace(_options.Issuer) ||
            string.IsNullOrWhiteSpace(_options.Audience))
        {
            throw new InvalidOperationException(
                "El emisor y la audiencia JWT deben estar configurados.");
        }

        if (_options.AccessTokenExpirationMinutes <= 0 ||
            _options.RefreshTokenExpirationDays <= 0)
        {
            throw new InvalidOperationException(
                "Los tiempos de expiración deben ser mayores que cero.");
        }
    }

    public string GenerarAccessToken(Usuario usuario)
    {
        ArgumentNullException.ThrowIfNull(usuario);

        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                usuario.Id.ToString()),

            new(
                ClaimTypes.NameIdentifier,
                usuario.Id.ToString()),

            new(
                JwtRegisteredClaimNames.Email,
                usuario.Correo),

            new(
                ClaimTypes.Email,
                usuario.Correo),

            new(
                JwtRegisteredClaimNames.Jti,
                Guid.NewGuid().ToString())
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(_secretKey),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: ObtenerExpiracionAccessToken(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public DateTime ObtenerExpiracionAccessToken()
    {
        return DateTime.UtcNow.AddMinutes(
            _options.AccessTokenExpirationMinutes);
    }

    public string GenerarRefreshToken()
    {
        byte[] bytes = RandomNumberGenerator.GetBytes(64);

        return Convert.ToBase64String(bytes)
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
    }

    public string CalcularHashRefreshToken(string refreshToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(refreshToken);

        byte[] bytes = Encoding.UTF8.GetBytes(refreshToken);
        byte[] hash = SHA256.HashData(bytes);

        return Convert.ToHexString(hash);
    }

    public DateTime ObtenerExpiracionRefreshToken()
    {
        return DateTime.UtcNow.AddDays(
            _options.RefreshTokenExpirationDays);
    }
}
