
using System.ComponentModel.DataAnnotations;
using PortalEvidencias.Aplicacion.DTOs.Auth;

namespace PortalEvidencias.Aplicacion.Validators;

public static class LoginValidator
{
    public static void Validar(LoginRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (string.IsNullOrWhiteSpace(dto.Correo))
            throw new ArgumentException("El correo es obligatorio.");        

        // Dentro de Validar:
        if (!new EmailAddressAttribute().IsValid(dto.Correo))
            throw new ArgumentException("El correo electrónico no es válido.");

        if (string.IsNullOrEmpty(dto.Contrasena))
            throw new ArgumentException("La contraseña es obligatoria.");
    }
}
