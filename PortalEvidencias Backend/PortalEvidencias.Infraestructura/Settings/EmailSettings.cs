
namespace PortalEvidencias.Infraestructura.Settings;

public class EmailSettings
{
    public string SmtpServer { get; set; } = string.Empty;

    public int SmtpPort { get; set; } = 587;

    public string SenderName { get; set; } = "Portal de Evidencias";

    public string SenderEmail { get; set; } = string.Empty;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public bool EnableSsl { get; set; } = true;
}
