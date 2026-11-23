
using System.ComponentModel.DataAnnotations;
using PortalEvidencias.Aplicacion.DTOs.Auth;

namespace PortalEvidencias.Aplicacion.Validators;

public static class VerificarCodigoRecuperacionValidator
{
    public static void Validar(VerificarCodigoRecuperacionDto dto)
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

        if (string.IsNullOrWhiteSpace(dto.Codigo))
        {
            throw new ArgumentException(
                "El código de verificación es obligatorio.");
        }

        string codigo = dto.Codigo.Trim();

        if (codigo.Length != 6 ||
            !codigo.All(char.IsDigit))
        {
            throw new ArgumentException(
                "El código debe contener exactamente 6 dígitos.");
        }
    }
}
