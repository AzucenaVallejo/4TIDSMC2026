using System;
using System.Collections.Generic;
using System.Text;



using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Aplicacion.Interfaces.Security;

public interface ITokenService
{
    string GenerarAccessToken(Usuario usuario);

    DateTime ObtenerExpiracionAccessToken();

    string GenerarRefreshToken();

    string CalcularHashRefreshToken(string refreshToken);

    DateTime ObtenerExpiracionRefreshToken();
}


