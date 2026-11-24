
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Usuarios;
using PortalEvidencias.Aplicacion.Interfaces.Services;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuariosController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    [HttpGet("me")]
    public async Task<ActionResult<UsuarioResponseDto>> ObtenerMiCuenta()
    {
        var usuarioId = ObtenerUsuarioId();

        var usuario = await _usuarioService.ObtenerPorIdAsync(usuarioId);

        if (usuario is null)
            return NotFound(new
            {
                mensaje = "No se encontró el usuario autenticado."
            });

        return Ok(usuario);
    }

    [HttpPut("me")]
    public async Task<ActionResult<UsuarioResponseDto>> ActualizarMiCuenta(
        [FromBody] ActualizarUsuarioRequestDto dto)
    {
        var usuarioId = ObtenerUsuarioId();

        var usuario = await _usuarioService.ActualizarAsync(
            usuarioId,
            dto);

        return Ok(usuario);
    }

    private int ObtenerUsuarioId()
    {
        var identificador = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(identificador, out var usuarioId))
        {
            throw new UnauthorizedAccessException(
                "El token no contiene un identificador de usuario válido.");
        }

        return usuarioId;
    }
}
