
using PortalEvidencias.Aplicacion.DTOs.Auth;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResponseDto> RegistrarAsync(RegistroRequestDto dto);
    Task<AuthResponseDto> IniciarSesionAsync(LoginRequestDto dto);
    Task<AuthResponseDto> IniciarSesionGoogleAsync(GoogleLoginRequestDto dto);
    Task<AuthResponseDto> RenovarTokenAsync(RefreshTokenRequestDto dto);
    Task CerrarSesionAsync(RefreshTokenRequestDto dto);
}
