
using System;
using System.Collections.Generic;
using PortalEvidencias.Aplicacion.DTOs.Curriculum;

namespace PortalEvidencias.Aplicacion.Validators;

public static class CurriculumValidator
{
    public static void Validar(CrearCurriculumRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        ValidarNombre(dto.Nombre);
    }

    public static void Validar(ActualizarCurriculumRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);
        ValidarNombre(dto.Nombre);
    }

    public static void Validar(ActualizarSeccionesRequestDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.Secciones is null)
        {
            throw new ArgumentException(
                "Debes proporcionar la lista de secciones.");
        }

        var tipos = new HashSet<string>(
            StringComparer.OrdinalIgnoreCase);

        foreach (var seccion in dto.Secciones)
        {
            if (seccion is null)
            {
                throw new ArgumentException(
                    "La lista contiene una sección no válida.");
            }

            if (string.IsNullOrWhiteSpace(seccion.TipoSeccion))
            {
                throw new ArgumentException(
                    "Todas las secciones deben tener un tipo.");
            }

            string tipo = seccion.TipoSeccion.Trim();

            if (tipo.Length > 80)
            {
                throw new ArgumentException(
                    "El tipo de sección no puede superar 80 caracteres.");
            }

            if (seccion.Orden < 0)
            {
                throw new ArgumentException(
                    "El orden de una sección no puede ser negativo.");
            }

            if (!tipos.Add(tipo))
            {
                throw new ArgumentException(
                    "No puedes registrar dos secciones del mismo tipo.");
            }
        }
    }

    public static void ValidarUsuarioId(int usuarioId)
    {
        if (usuarioId <= 0)
        {
            throw new ArgumentException(
                "El identificador del usuario no es válido.");
        }
    }

    public static void ValidarIdentificadores(int id, int usuarioId)
    {
        if (id <= 0)
        {
            throw new ArgumentException(
                "El identificador del currículum no es válido.");
        }

        ValidarUsuarioId(usuarioId);
    }

    private static void ValidarNombre(string? nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new ArgumentException(
                "El nombre del currículum es obligatorio.");
        }

        if (nombre.Trim().Length > 150)
        {
            throw new ArgumentException(
                "El nombre no puede superar 150 caracteres.");
        }
    }
}
