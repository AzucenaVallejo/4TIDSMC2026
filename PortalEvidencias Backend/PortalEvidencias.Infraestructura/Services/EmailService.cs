
using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using PortalEvidencias.Aplicacion.Interfaces.Services;
using PortalEvidencias.Infraestructura.Settings;

namespace PortalEvidencias.Infraestructura.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> options)
    {
        _settings = options.Value;
    }

    public async Task EnviarCodigoRecuperacionAsync(
        string correo,
        string codigo)
    {
        using var mensaje = new MailMessage();

        mensaje.From = new MailAddress(
            _settings.SenderEmail,
            _settings.SenderName);

        mensaje.To.Add(correo);

        mensaje.Subject = "Código de recuperación - Portal de Evidencias";

        mensaje.IsBodyHtml = true;

        mensaje.Body = $"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin:0; padding:30px; background-color:#f4f6f9;
                         font-family:Arial,sans-serif;">

                <div style="max-width:520px; margin:auto; padding:35px;
                            background-color:#ffffff; border-radius:12px;">

                    <h2 style="color:#173b63; text-align:center;">
                        Portal de Evidencias
                    </h2>

                    <h3 style="color:#333333;">
                        Recuperación de contraseña
                    </h3>

                    <p style="color:#555555; line-height:1.6;">
                        Recibimos una solicitud para restablecer la contraseña
                        de tu cuenta.
                    </p>

                    <p style="color:#555555;">
                        Utiliza el siguiente código de verificación:
                    </p>

                    <div style="margin:25px 0; padding:20px;
                                background-color:#f0f4f8;
                                border-radius:8px;
                                text-align:center;">

                        <span style="font-size:32px; font-weight:bold;
                                     letter-spacing:8px; color:#173b63;">
                            {codigo}
                        </span>

                    </div>

                    <p style="color:#555555;">
                        Este código tiene una vigencia de 10 minutos.
                    </p>

                    <p style="color:#777777; font-size:13px; line-height:1.5;">
                        Si no solicitaste este cambio, puedes ignorar
                        este mensaje. No compartas este código con nadie.
                    </p>

                    <hr style="border:none; border-top:1px solid #eeeeee;
                               margin:25px 0;">

                    <p style="color:#999999; font-size:12px;
                              text-align:center;">
                        Mensaje automático del Portal de Evidencias.
                        No respondas a este correo.
                    </p>

                </div>
            </body>
            </html>
            """;

        using var cliente = new SmtpClient(
            _settings.SmtpServer,
            _settings.SmtpPort)
        {
            EnableSsl = _settings.EnableSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(
                _settings.Username,
                _settings.Password),
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        await cliente.SendMailAsync(mensaje);
    }
}
