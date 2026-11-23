
namespace PortalEvidencias.Middleware;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    public GlobalExceptionMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (
            context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogDebug(
                "Solicitud cancelada: {Method} {Path}",
                context.Request.Method,
                context.Request.Path);
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted)
            {
                _logger.LogError(
                    exception,
                    "La respuesta ya había comenzado para {Method} {Path}",
                    context.Request.Method,
                    context.Request.Path);

                throw;
            }

            var (statusCode, message) = ObtenerRespuesta(exception);

            if (statusCode >= StatusCodes.Status500InternalServerError)
            {
                _logger.LogError(
                    exception,
                    "Error interno al procesar {Method} {Path}",
                    context.Request.Method,
                    context.Request.Path);
            }
            else
            {
                _logger.LogWarning(
                    "Solicitud rechazada con HTTP {StatusCode} en {Method} {Path}",
                    statusCode,
                    context.Request.Method,
                    context.Request.Path);
            }

            context.Response.Clear();
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json; charset=utf-8";

            await context.Response.WriteAsJsonAsync(new
            {
                status = statusCode,
                message,
                traceId = context.TraceIdentifier
            });
        }
    }

    private static (int StatusCode, string Message) ObtenerRespuesta(
        Exception exception)
    {
        return exception switch
        {
            BadHttpRequestException =>
                (StatusCodes.Status400BadRequest,
                 "La solicitud enviada no es válida."),

            UnauthorizedAccessException =>
                (StatusCodes.Status401Unauthorized,
                 "No se pudo autenticar la solicitud."),

            KeyNotFoundException =>
                (StatusCodes.Status404NotFound,
                 "No se encontró el recurso solicitado."),

            ArgumentException =>
                (StatusCodes.Status400BadRequest,
                 "Los datos enviados no son válidos."),

            InvalidOperationException =>
                (StatusCodes.Status409Conflict,
                 "No se pudo completar la operación debido a un conflicto con el estado actual del recurso."),

            _ =>
                (StatusCodes.Status500InternalServerError,
                 "Ocurrió un error interno al procesar la solicitud.")
        };
    }
}
