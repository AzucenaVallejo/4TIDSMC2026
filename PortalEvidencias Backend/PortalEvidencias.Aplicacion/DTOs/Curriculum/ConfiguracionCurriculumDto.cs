
namespace PortalEvidencias.Aplicacion.DTOs.Curriculum;

public class ConfiguracionCurriculumDto
{
    public bool ShowPhoto { get; set; } = true;

    public bool ShowEmail { get; set; } = true;

    public bool ShowPhone { get; set; } = true;

    public List<string> SelectedExperience { get; set; } = [];

    public List<string> SelectedEducation { get; set; } = [];

    public List<string> SelectedSkills { get; set; } = [];

    public List<string> SelectedProjects { get; set; } = [];
}
