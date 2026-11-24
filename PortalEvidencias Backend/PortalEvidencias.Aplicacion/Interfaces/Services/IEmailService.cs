
namespace PortalEvidencias.Aplicacion.Interfaces.Services;

public interface IEmailService
{
    Task EnviarCodigoRecuperacionAsync(string correo, string codigo);
}
