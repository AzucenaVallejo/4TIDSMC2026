
using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using PortalEvidencias.Aplicacion.Interfaces.Security;
using PortalEvidencias.Infraestructura.Options;

namespace PortalEvidencias.Infraestructura.Security;

public class GoogleIdentityService : IGoogleIdentityService
{
    private readonly GoogleOptions _options;

    public GoogleIdentityService(IOptions<GoogleOptions> options)
    {
        _options = options.Value;
    }

    public async Task<GoogleIdentityResult?> ValidarIdTokenAsync(string idToken)
    {
        if (string.IsNullOrWhiteSpace(idToken))
            return null;

        if (string.IsNullOrWhiteSpace(_options.ClientId))
        {
            throw new InvalidOperationException(
                "El Client ID de Google no está configurado.");
        }

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { _options.ClientId }
                });

            return new GoogleIdentityResult
            {
                IdentificadorExterno = payload.Subject,
                Correo = payload.Email,
                CorreoVerificado = payload.EmailVerified,
                Nombre = payload.Name ?? string.Empty
            };
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
