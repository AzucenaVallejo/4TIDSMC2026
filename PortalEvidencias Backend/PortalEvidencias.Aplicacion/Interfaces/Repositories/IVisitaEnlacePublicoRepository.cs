using PortalEvidencias.Dominio.Entities;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Aplicacion.Interfaces.Repositories;

public interface IVisitaEnlacePublicoRepository
{
    Task AgregarAsync(VisitaEnlacePublico visita);

    Task<bool> ExisteMeGustaAsync(
        int enlacePublicoId,
        string identificadorVisitante);

    Task<int> ContarEventosAsync(
        int enlacePublicoId,
        TipoEventoEnlacePublico tipoEvento,
        DateTime? desde = null);

    Task GuardarCambiosAsync();
}