using System;
using System.Collections.Generic;
using System.Text;

namespace PortalEvidencias.Aplicacion.DTOs.Reportes;

public class ReporteResponseDto
{
    public int Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaActualizacion { get; set; }
}
