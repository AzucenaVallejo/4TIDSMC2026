using System;
using System.Collections.Generic;
using System.Text;


namespace PortalEvidencias.Aplicacion.Interfaces.Security;

public interface IGoogleIdentityService
{
    Task<GoogleIdentityResult?> ValidarIdTokenAsync(string idToken);
}

public class GoogleIdentityResult
{
    public string IdentificadorExterno { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public bool CorreoVerificado { get; set; }
    public string Nombre { get; set; } = string.Empty;
}

