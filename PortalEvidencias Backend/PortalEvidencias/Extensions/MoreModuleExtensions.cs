using PortalEvidencias.Aplicacion.Interfaces.Repositories;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Aplicacion.Services;
using PortalEvidencias.Infraestructura.Repositories;

namespace PortalEvidencias.Extensions;

public static class MoreModuleExtensions
{
    public static IServiceCollection AddMoreModule(
        this IServiceCollection services)
    {
        // Repositorios
        services.AddScoped<IPreferenciaUsuarioRepository,
            PreferenciaUsuarioRepository>();

        services.AddScoped<IReporteProblemaRepository,
            ReporteProblemaRepository>();

        // Servicios
        services.AddScoped<IPreferenciaUsuarioService,
            PreferenciaUsuarioService>();

        services.AddScoped<IReporteProblemaService,
            ReporteProblemaService>();

        return services;
    }
}