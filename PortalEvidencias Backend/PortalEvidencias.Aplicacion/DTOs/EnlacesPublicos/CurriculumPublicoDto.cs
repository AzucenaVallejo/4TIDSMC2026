using PortalEvidencias.Aplicacion.DTOs.Curriculum;
namespace PortalEvidencias.Aplicacion.DTOs.EnlacesPublicos;

public class CurriculumPublicoDto
{
    public string Nombre { get; set; } = string.Empty;
    public List<string> SeccionesVisibles { get; set; } = [];
    public ConfiguracionCurriculumDto? ConfiguracionConstructor { get; set; }

    public PerfilPublicoDto? Perfil { get; set; }

    public List<FormacionPublicaDto> Formacion { get; set; } = [];

    public List<ExperienciaPublicaDto> Experiencia { get; set; } = [];

    public List<ActividadPublicaDto> Actividades { get; set; } = [];

    public List<ProyectoPublicoDto> Proyectos { get; set; } = [];

    public List<PracticaPublicaDto> Practicas { get; set; } = [];

    public List<HabilidadPublicaDto> Habilidades { get; set; } = [];

    public List<InteresPublicoDto> Intereses { get; set; } = [];
   
}