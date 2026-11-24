using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PortalEvidencias.Aplicacion.DTOs.Documentos;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Dominio.Enums;

namespace PortalEvidencias.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly IDocumentoService _documentoService;

    public DocumentosController(IDocumentoService documentoService)
    {
        _documentoService = documentoService;
    }

    [HttpGet]
    public async Task<ActionResult<List<DocumentoResponseDto>>> ObtenerPorUsuario()
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var documentos = await _documentoService
            .ObtenerPorUsuarioAsync(usuarioId);

        return Ok(documentos);
    }

    [HttpGet("{documentoId:int}")]
    public async Task<ActionResult<DocumentoResponseDto>> ObtenerPorId(
        int documentoId)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var documento = await _documentoService.ObtenerPorIdAsync(
            documentoId,
            usuarioId);

        if (documento is null)
            return NotFound();

        return Ok(documento);
    }

    [HttpGet("proyecto/{proyectoId:int}")]
    public async Task<ActionResult<List<DocumentoResponseDto>>> ObtenerPorProyecto(
        int proyectoId)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var documentos = await _documentoService
            .ObtenerPorProyectoAsync(proyectoId, usuarioId);

        return Ok(documentos);
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(11 * 1024 * 1024)]
    public async Task<ActionResult<DocumentoResponseDto>> Subir(
        [FromForm] IFormFile archivo,
        [FromForm] TipoDocumento tipoDocumento,
        [FromForm] int? proyectoId)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        if (archivo is null || archivo.Length == 0)
        {
            return BadRequest(new
            {
                mensaje = "Debes seleccionar un archivo."
            });
        }

        long limite = tipoDocumento == TipoDocumento.FotografiaPerfil
            ? 5L * 1024 * 1024
            : 10L * 1024 * 1024;

        if (archivo.Length > limite)
        {
            return BadRequest(new
            {
                mensaje = $"El archivo supera el límite de {limite / (1024 * 1024)} MB."
            });
        }

        await using var stream = new MemoryStream();
        await archivo.CopyToAsync(stream);

        var documento = await _documentoService.SubirAsync(
            usuarioId,
            archivo.FileName,
            archivo.ContentType,
            stream.ToArray(),
            tipoDocumento,
            proyectoId);

        return CreatedAtAction(
            nameof(ObtenerPorId),
            new { documentoId = documento.Id },
            documento);
    }

    [HttpGet("{documentoId:int}/descargar")]
    public async Task<IActionResult> Descargar(int documentoId)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var archivo = await _documentoService.DescargarAsync(
            documentoId,
            usuarioId);

        return File(
            archivo.Contenido,
            archivo.TipoContenido,
            Path.GetFileName(archivo.NombreArchivo));
    }
    [HttpGet("{documentoId:int}/visualizar")]
    public async Task<IActionResult> Visualizar(int documentoId)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        var archivo = await _documentoService.DescargarAsync(
            documentoId,
            usuarioId);

        bool formatoPermitido =
            archivo.TipoContenido == "application/pdf" ||
            archivo.TipoContenido == "image/jpeg" ||
            archivo.TipoContenido == "image/png" ||
            archivo.TipoContenido == "image/webp";

        if (!formatoPermitido)
        {
            return BadRequest(new
            {
                mensaje = "Este formato no puede visualizarse en el navegador."
            });
        }

        Response.Headers["X-Content-Type-Options"] = "nosniff";

        return File(
            archivo.Contenido,
            archivo.TipoContenido);
    }
    [HttpDelete("{documentoId:int}")]
    public async Task<IActionResult> Eliminar(int documentoId)
    {
        if (!IntentarObtenerUsuarioId(out int usuarioId))
            return Unauthorized();

        await _documentoService.EliminarAsync(
            documentoId,
            usuarioId);

        return NoContent();
    }

    private bool IntentarObtenerUsuarioId(out int usuarioId)
    {
        var identificador =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        return int.TryParse(identificador, out usuarioId) && usuarioId > 0;
    }
}