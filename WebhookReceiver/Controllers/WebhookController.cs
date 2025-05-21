using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.IO;
using System.Text.Json;

namespace WebhookReceiver.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WebhookController : ControllerBase
    {
        private readonly ILogger<WebhookController> _logger;

        public WebhookController(ILogger<WebhookController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> ReceiveWebhook()
        {
            // Leer el cuerpo completo de la petición
            using var reader = new StreamReader(Request.Body);
            var body = await reader.ReadToEndAsync();

            // Loggear el payload recibido
            _logger.LogInformation("📩 Webhook recibido: {Payload}", body);

            // (Opcional) Persistir en un archivo de log local
            var logLine = $"{DateTime.Now:yyyy-MM-dd HH:mm:ss} - {body}{Environment.NewLine}";
            await System.IO.File.AppendAllTextAsync("webhook_log.txt", logLine);

            // Intentar parsear JSON para devolverlo en la respuesta
            object parsed = null;
            try
            {
                parsed = JsonSerializer.Deserialize<object>(body);
            }
            catch
            {
                // Ignorar si no es JSON válido
            }

            // Responder OK con el contenido deserializado
            return Ok(new
            {
                message = "Webhook recibido correctamente",
                recibido = parsed
            });
        }
    }
}
