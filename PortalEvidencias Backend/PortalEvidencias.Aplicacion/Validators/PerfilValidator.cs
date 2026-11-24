
using PortalEvidencias.Aplicacion.DTOs.Perfil;

namespace PortalEvidencias.Aplicacion.Validators;

public static class PerfilValidator
{
    public static void Validar(ActualizarPerfilRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.Nombres is not null)
        {
            string nombres = dto.Nombres.Trim();

            if (string.IsNullOrWhiteSpace(nombres))
            {
                throw new ArgumentException(
                    "El campo de nombres no puede estar vacío.");
            }

            if (nombres.Length > 100)
            {
                throw new ArgumentException(
                    "Los nombres no pueden superar los 100 caracteres.");
            }
        }

        if (dto.ApellidoPaterno is not null)
        {
            string apellidoPaterno = dto.ApellidoPaterno.Trim();

            if (string.IsNullOrWhiteSpace(apellidoPaterno))
            {
                throw new ArgumentException(
                    "El apellido paterno no puede estar vacío.");
            }

            if (apellidoPaterno.Length > 50)
            {
                throw new ArgumentException(
                    "El apellido paterno no puede superar los 50 caracteres.");
            }
        }

        if (dto.ApellidoMaterno is not null &&
            dto.ApellidoMaterno.Trim().Length > 50)
        {
            throw new ArgumentException(
                "El apellido materno no puede superar los 50 caracteres.");
        }

        if (dto.Telefono is not null)
        {
            string telefono = dto.Telefono.Trim();

            if (telefono.Length > 20)
            {
                throw new ArgumentException(
                    "El teléfono no puede superar los 20 caracteres.");
            }
        }

        if (dto.EliminarFechaNacimiento &&
            dto.FechaNacimiento.HasValue)
        {
            throw new ArgumentException(
                "No puedes establecer y eliminar la fecha de nacimiento al mismo tiempo.");
        }

        if (dto.FechaNacimiento.HasValue &&
            dto.FechaNacimiento.Value > DateOnly.FromDateTime(DateTime.UtcNow))
        {
            throw new ArgumentException(
                "La fecha de nacimiento no puede ser futura.");
        }

        if (dto.Biografia is not null &&
            dto.Biografia.Trim().Length > 2000)
        {
            throw new ArgumentException(
                "La biografía no puede superar los 2000 caracteres.");
        }

        if (dto.Curp is not null)
        {
            string curp = dto.Curp.Trim();

            if (curp.Length != 18)
            {
                throw new ArgumentException(
                    "La CURP debe contener exactamente 18 caracteres.");
            }

            if (!EsCurpConFormatoValido(curp))
            {
                throw new ArgumentException(
                    "La CURP contiene caracteres o un formato no válido.");
            }
        }
    }

    private static bool EsCurpConFormatoValido(string curp)
    {
        // Comprueba la estructura general, no la existencia oficial de la CURP.
        return System.Text.RegularExpressions.Regex.IsMatch(
            curp,
            @"^[A-Za-z]{4}\d{6}[HM][A-Za-z]{5}[A-Za-z0-9]\d$",
            System.Text.RegularExpressions.RegexOptions.CultureInvariant);
    }
}
