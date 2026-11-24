using PortalEvidencias.Aplicacion.DTOs.EstadisticasPublicas;
using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;

namespace PortalEvidencias.Aplicacion.Services;

public class VisitaEnlacePublicoService : IVisitaEnlacePublicoService
{
    private readonly IVisitaEnlacePublicoRepository _repository;

    public VisitaEnlacePublicoService(
        IVisitaEnlacePublicoRepository repository)
    {
        _repository = repository;
    }

    public async Task RegistrarVisualizacionAsync(
        int enlacePublicoId,
        string? identificadorVisitante)
    {
        ValidarEnlace(enlacePublicoId);

        var visita = new VisitaEnlacePublico
        {
            EnlacePublicoId = enlacePublicoId,
            TipoEvento = TipoEventoEnlacePublico.Visualizacion,
            FechaEvento = DateTime.UtcNow,
            IdentificadorVisitante = identificadorVisitante
        };

        await _repository.AgregarAsync(visita);
        await _repository.GuardarCambiosAsync();
    }

    public async Task RegistrarMeGustaAsync(
    int enlacePublicoId,
    string identificadorVisitante)
    {

        ValidarEnlace(enlacePublicoId);

        if (string.IsNullOrWhiteSpace(identificadorVisitante))
            throw new ArgumentException(
                "El identificador del visitante es obligatorio.");

        var existe = await _repository.ExisteMeGustaAsync(
            enlacePublicoId,
            identificadorVisitante);

        if (existe)
            return;

        var visita = new VisitaEnlacePublico
        {
            EnlacePublicoId = enlacePublicoId,
            TipoEvento = TipoEventoEnlacePublico.MeGusta,
            IdentificadorVisitante = identificadorVisitante,
            FechaEvento = DateTime.UtcNow
        };

        await _repository.AgregarAsync(visita);

        try
        {
            await _repository.GuardarCambiosAsync();
        }
        catch (DbUpdateException ex) when (EsDuplicidadSqlServer(ex))
        {
            // El índice único impidió registrar un Me gusta duplicado.
            // La operación se considera atendida.
        }

    }
    private static bool EsDuplicidadSqlServer(Exception exception)
    {
        while (exception != null)
        {
            if (exception is SqlException sqlException &&
                sqlException.Errors
                    .Cast<SqlError>()
                    .Any(error => error.Number is 2601 or 2627))
            {
                return true;
            }

            exception = exception.InnerException!;
        }

        return false;
    }
    public async Task RegistrarDescargaCurriculumAsync(
        int enlacePublicoId,
        string? identificadorVisitante)
    {
        ValidarEnlace(enlacePublicoId);

        var visita = new VisitaEnlacePublico
        {
            EnlacePublicoId = enlacePublicoId,
            TipoEvento = TipoEventoEnlacePublico.DescargaCurriculum,
            FechaEvento = DateTime.UtcNow,
            IdentificadorVisitante = identificadorVisitante
        };

        await _repository.AgregarAsync(visita);
        await _repository.GuardarCambiosAsync();
    }

    public Task<int> ObtenerVisualizacionesTotalesAsync(int enlacePublicoId)
    {
        ValidarEnlace(enlacePublicoId);

        return _repository.ContarEventosAsync(
            enlacePublicoId,
            TipoEventoEnlacePublico.Visualizacion);
    }

    public Task<int> ObtenerVisualizacionesSemanalesAsync(int enlacePublicoId)
    {
        ValidarEnlace(enlacePublicoId);

        var fechaInicio = DateTime.UtcNow.AddDays(-7);

        return _repository.ContarEventosAsync(
            enlacePublicoId,
            TipoEventoEnlacePublico.Visualizacion,
            fechaInicio);
    }    

    public async Task<EstadisticasEnlacePublicoDto> ObtenerEstadisticasAsync(
    int enlacePublicoId)
    {
        ValidarEnlace(enlacePublicoId);

        return new EstadisticasEnlacePublicoDto
        {
            VisualizacionesTotales =
                await ObtenerVisualizacionesTotalesAsync(enlacePublicoId),

            VisualizacionesSemanales =
                await ObtenerVisualizacionesSemanalesAsync(enlacePublicoId),

            MeGustas =
                await ObtenerMeGustasAsync(enlacePublicoId),

            DescargasCurriculum =
                await ObtenerDescargasCurriculumAsync(enlacePublicoId)
        };
    }
    public Task<int> ObtenerMeGustasAsync(int enlacePublicoId)
    {
        ValidarEnlace(enlacePublicoId);

        return _repository.ContarEventosAsync(
            enlacePublicoId,
            TipoEventoEnlacePublico.MeGusta);
    }

    public Task<int> ObtenerDescargasCurriculumAsync(int enlacePublicoId)
    {
        ValidarEnlace(enlacePublicoId);

        return _repository.ContarEventosAsync(
            enlacePublicoId,
            TipoEventoEnlacePublico.DescargaCurriculum);
    }

    private static void ValidarEnlace(int enlacePublicoId)
    {
        if (enlacePublicoId <= 0)
            throw new ArgumentException("El identificador del enlace no es válido.");
    }
}