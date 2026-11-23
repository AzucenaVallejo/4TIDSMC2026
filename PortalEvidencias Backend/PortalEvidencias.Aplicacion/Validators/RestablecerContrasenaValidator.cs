
using PortalEvidencias.Aplicacion.DTOs.Auth;

namespace PortalEvidencias.Aplicacion.Validators;

public static class RestablecerContrasenaValidator
{
    public static void Validar(RestablecerContrasenaDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.TokenRestablecimiento))
        {
            throw new ArgumentException(
                "El token de restablecimiento es obligatorio.");
        }

        if (dto.TokenRestablecimiento.Length > 256)
        {
            throw new ArgumentException(
                "El token de restablecimiento no es válido.");
        }

        if (string.IsNullOrEmpty(dto.NuevaContrasena))
        {
            throw new ArgumentException(
                "La nueva contraseña es obligatoria.");
        }

        if (dto.NuevaContrasena.Length < 8 ||
            dto.NuevaContrasena.Length > 100)
        {
            throw new ArgumentException(
                "La contraseña debe tener entre 8 y 100 caracteres.");
        }

        if (string.IsNullOrEmpty(dto.ConfirmarContrasena))
        {
            throw new ArgumentException(
                "Debes confirmar la nueva contraseña.");
        }

        if (dto.NuevaContrasena != dto.ConfirmarContrasena)
        {
            throw new ArgumentException(
                "Las contraseñas no coinciden.");
        }
    }
}
