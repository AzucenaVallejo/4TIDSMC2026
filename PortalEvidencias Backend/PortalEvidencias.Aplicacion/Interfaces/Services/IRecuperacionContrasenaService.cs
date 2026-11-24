
using PortalEvidencias.Aplicacion.DTOs.Auth;

namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IRecuperacionContrasenaService
{
    Task SolicitarRecuperacionAsync(SolicitarRecuperacionDto dto);

    Task<VerificarCodigoRecuperacionResponseDto> VerificarCodigoAsync(
        VerificarCodigoRecuperacionDto dto);

    Task RestablecerContrasenaAsync(RestablecerContrasenaDto dto);

    Task ReenviarCodigoAsync(SolicitarRecuperacionDto dto);
}
