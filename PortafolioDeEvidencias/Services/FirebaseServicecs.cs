
using Google.Cloud.Firestore;
using PortafolioDeEvidencias.DTOs;

namespace PortafolioDeEvidencias.Services
{
    public class FirebaseService
    {
        private readonly FirestoreDb _firestore;

        public FirebaseService(FirestoreDb firestore)
        {
            _firestore = firestore;
        }

        // Probar conexión con Firestore
        public async Task ProbarConexion()
        {
            var coleccion = _firestore.Collection("pruebas");

            var documento = new Dictionary<string, object>
            {
                { "mensaje", "Conexión exitosa desde C#" },
                { "fecha", Timestamp.GetCurrentTimestamp() }
            };

            await coleccion.Document("conexion").SetAsync(documento);
        }

        // Crear o actualizar el perfil básico del usuario
        public async Task GuardarUsuario(
            string uid, string nombre, string correo)
        {
            var documento = _firestore
                .Collection("usuarios")
                .Document(uid);

            var snapshot = await documento.GetSnapshotAsync();

            var datos = new Dictionary<string, object>
            {
                { "nombre", nombre },
                { "correo", correo },
                { "fechaActualizacion", Timestamp.GetCurrentTimestamp() }
            };

            if (!snapshot.Exists)
            {
                datos["fechaRegistro"] = Timestamp.GetCurrentTimestamp();
            }

            await documento.SetAsync(datos, SetOptions.MergeAll);
        }

        // Guardar todo el portafolio
        public async Task GuardarPortafolio(
            string uid, PortafolioDto datos)
        {
            var documento = _firestore
                .Collection("usuarios")
                .Document(uid)
                .Collection("portafolio")
                .Document("principal");

            var perfil = new Dictionary<string, object>
            {
                { "nombres", datos.Profile.Nombres },
                { "apellidoPaterno", datos.Profile.ApellidoPaterno },
                { "apellidoMaterno", datos.Profile.ApellidoMaterno },
                { "fechaNacimiento", datos.Profile.FechaNacimiento.HasValue
                    ? Timestamp.FromDateTime(
                        DateTime.SpecifyKind(
                            datos.Profile.FechaNacimiento.Value,
                            DateTimeKind.Utc))
                    : null },
                { "telefono", datos.Profile.Telefono },
                { "correo", datos.Profile.Correo },
                { "curp", datos.Profile.CURP },
                { "domicilio", datos.Profile.Domicilio },
                { "fotografia", datos.Profile.Fotografia }
            };

            var contenido = new Dictionary<string, object>
            {
                { "profile", perfil },
                { "education", ConvertirRegistros(datos.Education) },
                { "extra", ConvertirRegistros(datos.Extra) },
                { "experience", ConvertirRegistros(datos.Experience) },
                { "projects", ConvertirRegistros(datos.Projects) },
                { "skills", datos.Skills },
                { "interests", datos.Interests },
                { "fechaActualizacion", Timestamp.GetCurrentTimestamp() }
            };

            await documento.SetAsync(contenido);
        }

        // Convertir registros a formato Firestore
        private List<Dictionary<string, object>> ConvertirRegistros(
            List<RegistroPortafolioDto> registros)
        {
            return registros.Select(x => new Dictionary<string, object>
            {
                { "id", x.Id },
                { "title", x.Title },
                { "institution", x.Institution },
                { "period", x.Period },
                { "detail", x.Detail }
            }).ToList();
        }

        // Recuperar el portafolio de un usuario
        public async Task<PortafolioDto> ObtenerPortafolio(string uid)
        {
            var documento = _firestore
                .Collection("usuarios")
                .Document(uid)
                .Collection("portafolio")
                .Document("principal");

            var snapshot = await documento.GetSnapshotAsync();

            if (!snapshot.Exists)
                return new PortafolioDto();

            var datos = snapshot.ToDictionary();

            var portafolio = new PortafolioDto();

            if (datos.TryGetValue("profile", out var perfilObjeto) &&
                perfilObjeto is IDictionary<string, object> perfil)
            {
                portafolio.Profile.Nombres =
                    ObtenerTexto(perfil, "nombres");

                portafolio.Profile.ApellidoPaterno =
                    ObtenerTexto(perfil, "apellidoPaterno");

                portafolio.Profile.ApellidoMaterno =
                    ObtenerTexto(perfil, "apellidoMaterno");

                portafolio.Profile.Telefono =
                    ObtenerTexto(perfil, "telefono");

                portafolio.Profile.Correo =
                    ObtenerTexto(perfil, "correo");

                portafolio.Profile.CURP =
                    ObtenerTexto(perfil, "curp");

                portafolio.Profile.Domicilio =
                    ObtenerTexto(perfil, "domicilio");

                portafolio.Profile.Fotografia =
                    ObtenerTexto(perfil, "fotografia");

                if (perfil.TryGetValue("fechaNacimiento", out var fecha) &&
                    fecha is Timestamp timestamp)
                {
                    portafolio.Profile.FechaNacimiento =
                        timestamp.ToDateTime();
                }
            }

            portafolio.Education = ObtenerRegistros(datos, "education");
            portafolio.Extra = ObtenerRegistros(datos, "extra");
            portafolio.Experience = ObtenerRegistros(datos, "experience");
            portafolio.Projects = ObtenerRegistros(datos, "projects");

            portafolio.Skills = ObtenerLista(datos, "skills");
            portafolio.Interests = ObtenerLista(datos, "interests");

            return portafolio;
        }

        // Obtener texto de un documento
        private string ObtenerTexto(
            IDictionary<string, object> datos, string campo)
        {
            return datos.TryGetValue(campo, out var valor)
                ? valor?.ToString() ?? ""
                : "";
        }

        // Recuperar listas de registros
        private List<RegistroPortafolioDto> ObtenerRegistros(
            Dictionary<string, object> datos, string campo)
        {
            var resultado = new List<RegistroPortafolioDto>();

            if (!datos.TryGetValue(campo, out var valor) ||
                valor is not IEnumerable<object> lista)
                return resultado;

            foreach (var elemento in lista)
            {
                if (elemento is IDictionary<string, object> registro)
                {
                    long.TryParse(
                        ObtenerTexto(registro, "id"), out long id);

                    resultado.Add(new RegistroPortafolioDto
                    {
                        Id = id,
                        Title = ObtenerTexto(registro, "title"),
                        Institution = ObtenerTexto(registro, "institution"),
                        Period = ObtenerTexto(registro, "period"),
                        Detail = ObtenerTexto(registro, "detail")
                    });
                }
            }

            return resultado;
        }

        // Recuperar habilidades e intereses
        private List<string> ObtenerLista(
            Dictionary<string, object> datos, string campo)
        {
            if (!datos.TryGetValue(campo, out var valor) ||
                valor is not IEnumerable<object> lista)
                return new List<string>();

            return lista.Select(x => x?.ToString() ?? "")
                .ToList();
        }

        // Guardar información de una evidencia
        public async Task<string> GuardarEvidencia(
            string uid, string registroId, string nombre,
            string seccion, string url)
        {
            var coleccion = _firestore
                .Collection("usuarios")
                .Document(uid)
                .Collection("evidencias");

            var documento = coleccion.Document();

            var datos = new Dictionary<string, object>
            {
                { "registroId", registroId },
                { "nombre", nombre },
                { "seccion", seccion },
                { "url", url },
                { "fechaRegistro", Timestamp.GetCurrentTimestamp() }
            };

            await documento.SetAsync(datos);

            return documento.Id;
        }

        // Obtener las evidencias de un usuario
        public async Task<List<Dictionary<string, object>>>
            ObtenerEvidencias(string uid)
        {
            var coleccion = _firestore
                .Collection("usuarios")
                .Document(uid)
                .Collection("evidencias");

            var resultado = await coleccion.GetSnapshotAsync();

            var evidencias = new List<Dictionary<string, object>>();

            foreach (var documento in resultado.Documents)
            {
                var datos = documento.ToDictionary();

                datos["id"] = documento.Id;

                evidencias.Add(datos);
            }

            return evidencias;
        }

        // Corregir el registro de una evidencia
        public async Task CorregirRegistroEvidencia(
            string uid, string evidenciaId, string nuevoRegistroId)
        {
            var documento = _firestore
                .Collection("usuarios")
                .Document(uid)
                .Collection("evidencias")
                .Document(evidenciaId);

            await documento.UpdateAsync(
                "registroId", nuevoRegistroId);
        }

        // Obtener una evidencia específica
        public async Task<Dictionary<string, object>?>
            ObtenerEvidencia(string uid, string evidenciaId)
        {
            var documento = _firestore
                .Collection("usuarios")
                .Document(uid)
                .Collection("evidencias")
                .Document(evidenciaId);

            var resultado = await documento.GetSnapshotAsync();

            if (!resultado.Exists)
                return null;

            return resultado.ToDictionary();
        }

        // Eliminar evidencia de Firestore
        public async Task EliminarEvidencia(
            string uid, string evidenciaId)
        {
            var documento = _firestore
                .Collection("usuarios")
                .Document(uid)
                .Collection("evidencias")
                .Document(evidenciaId);

            await documento.DeleteAsync();
        }
    }
}
