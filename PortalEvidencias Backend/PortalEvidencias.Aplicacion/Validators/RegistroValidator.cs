
using PortalEvidencias.Aplicacion.DTOs.Auth;
using System.ComponentModel.DataAnnotations;

namespace PortalEvidencias.Aplicacion.Validators;

public static class RegistroValidator
{
    public static void Validar(RegistroRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.Nombres))
            throw new ArgumentException("Los nombres son obligatorios.");

        if (dto.Nombres.Trim().Length > 100)
            throw new ArgumentException("Los nombres no pueden superar los 100 caracteres.");

        if (string.IsNullOrWhiteSpace(dto.ApellidoPaterno))
            throw new ArgumentException("El apellido paterno es obligatorio.");

        if (dto.ApellidoPaterno.Trim().Length > 100)
            throw new ArgumentException("El apellido paterno no puede superar los 100 caracteres.");

        if (string.IsNullOrWhiteSpace(dto.ApellidoMaterno))
            throw new ArgumentException("El apellido materno es obligatorio.");

        if (dto.ApellidoMaterno.Trim().Length > 100)
            throw new ArgumentException("El apellido materno no puede superar los 100 caracteres.");

        if (string.IsNullOrWhiteSpace(dto.Correo))
            throw new ArgumentException("El correo es obligatorio.");

        if (dto.Correo.Length > 256 ||
            !new EmailAddressAttribute().IsValid(dto.Correo))
        {
            throw new ArgumentException(
                "El correo electrónico no es válido.");
        }

        if (string.IsNullOrEmpty(dto.Contrasena) ||
            dto.Contrasena.Length < 8 ||
            dto.Contrasena.Length > 100)
        {
            throw new ArgumentException(
                "La contraseña debe tener entre 8 y 100 caracteres.");
        }

        if (string.IsNullOrEmpty(dto.ConfirmarContrasena))
            throw new ArgumentException("Debes confirmar la contraseña.");

        if (dto.Contrasena != dto.ConfirmarContrasena)
            throw new ArgumentException("Las contraseñas no coinciden.");
    }
}
