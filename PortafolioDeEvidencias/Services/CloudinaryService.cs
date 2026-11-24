
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace PortafolioDeEvidencias.Services
{
    public class CloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration configuration)
        {
            var cuenta = new Account(
                configuration["Cloudinary:CloudName"],
                configuration["Cloudinary:ApiKey"],
                configuration["Cloudinary:ApiSecret"]
            );

            _cloudinary = new Cloudinary(cuenta);
        }

        // Subir fotografía de perfil
        public async Task<string> SubirFotografia(
            IFormFile archivo, string uid)
        {
            ValidarImagen(archivo);

            using var stream = archivo.OpenReadStream();

            var parametros = new ImageUploadParams
            {
                File = new FileDescription(archivo.FileName, stream),
                Folder = $"portafolio/{uid}/fotografia",
                PublicId = "perfil",
                Overwrite = true
            };

            var resultado = await _cloudinary.UploadAsync(parametros);

            if (resultado.Error != null)
                throw new Exception(resultado.Error.Message);

            return resultado.SecureUrl.ToString();
        }

        // Subir evidencia o documento en imagen
        public async Task<string> SubirEvidencia(
            IFormFile archivo, string uid)
        {
            ValidarImagen(archivo);

            using var stream = archivo.OpenReadStream();

            var parametros = new ImageUploadParams
            {
                File = new FileDescription(archivo.FileName, stream),
                Folder = $"portafolio/{uid}/evidencias",
                PublicId = Guid.NewGuid().ToString(),
                Overwrite = false
            };

            var resultado = await _cloudinary.UploadAsync(parametros);

            if (resultado.Error != null)
                throw new Exception(resultado.Error.Message);

            return resultado.SecureUrl.ToString();
        }

        // Eliminar evidencia de Cloudinary
        public async Task EliminarEvidencia(string url, string uid)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out Uri? uri) ||
                uri.Host != "res.cloudinary.com")
                throw new Exception("La URL de la evidencia no es válida.");

            var partes = uri.AbsolutePath
                .Split('/', StringSplitOptions.RemoveEmptyEntries);

            int uploadIndex = Array.IndexOf(partes, "upload");

            if (uploadIndex < 0)
                throw new Exception("No se pudo identificar la imagen.");

            var archivos = partes.Skip(uploadIndex + 1).ToList();

            // Ignorar la versión de Cloudinary
            if (archivos.Count > 0 &&
                archivos[0].StartsWith("v") &&
                archivos[0].Length > 1 &&
                archivos[0].Substring(1).All(char.IsDigit))
            {
                archivos.RemoveAt(0);
            }

            if (archivos.Count == 0)
                throw new Exception("No se encontró la imagen.");

            string ultimo = archivos[^1];
            int extension = ultimo.LastIndexOf('.');

            if (extension >= 0)
                archivos[^1] = ultimo.Substring(0, extension);

            string publicId = string.Join("/", archivos);

            string carpetaEsperada =
                $"portafolio/{uid}/evidencias/";

            if (!publicId.StartsWith(
                carpetaEsperada, StringComparison.Ordinal))
                throw new Exception("No tienes permiso para eliminar esta imagen.");

            var parametros = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            };

            var resultado = await _cloudinary.DestroyAsync(parametros);

            if (resultado.Error != null ||
                resultado.Result != "ok")
                throw new Exception("No se pudo eliminar la imagen.");
        }

        // Validar formato y tamaño
        private void ValidarImagen(IFormFile archivo)
        {
            if (archivo == null || archivo.Length == 0)
                throw new Exception("No se seleccionó una imagen.");

            var extensionesPermitidas = new[]
            {
                ".jpg", ".jpeg", ".png", ".webp"
            };

            var extension = Path.GetExtension(archivo.FileName)
                .ToLowerInvariant();

            if (!extensionesPermitidas.Contains(extension))
                throw new Exception("Formato de imagen no permitido.");

            if (archivo.Length > 5 * 1024 * 1024)
                throw new Exception("La imagen no puede superar los 5 MB.");
        }
    }
}
