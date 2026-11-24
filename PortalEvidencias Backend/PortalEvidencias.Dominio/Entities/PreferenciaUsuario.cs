using System;
using System.Collections.Generic;
using System.Text;

namespace PortalEvidencias.Dominio.Entities;

public class PreferenciaUsuario
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }

    public string Tema { get; set; } = "auto";
    public string ColorAcento { get; set; } = "#2563eb";
    public string TamanoTexto { get; set; } = "medium";
    public bool ReducirAnimaciones { get; set; }
    public bool DensidadCompacta { get; set; }

    public bool NotificacionesGenerales { get; set; } = true;
    public bool RecordatoriosPerfil { get; set; } = true;
    public bool AvisosEvidencias { get; set; } = true;

    public string Idioma { get; set; } = "es";

    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
}