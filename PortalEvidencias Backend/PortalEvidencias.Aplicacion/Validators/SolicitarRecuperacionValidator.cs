
using System.ComponentModel.DataAnnotations;
using PortalEvidencias.Aplicacion.DTOs.Auth;

namespace PortalEvidencias.Aplicacion.Validators;

public static class SolicitarRecuperacionValidator
{
    public static void Validar(SolicitarRecuperacionDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.Correo))
        {
            throw new ArgumentException(
                "El correo electrónico es obligatorio.");
        }

        string correo = dto.Correo.Trim();

        if (correo.Length > 256 ||
            !new EmailAddressAttribute().IsValid(correo))
        {
            throw new ArgumentException(
                "El correo electrónico no es válido.");
        }
    }
}
