
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class ProyectoConfiguration : IEntityTypeConfiguration<Proyecto>
{
    public void Configure(EntityTypeBuilder<Proyecto> entity)
    {
        entity.ToTable("Proyectos");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Nombre)
            .HasMaxLength(200)
            .IsRequired();

        entity.Property(x => x.Descripcion)
            .HasMaxLength(4000);

        entity.Property(x => x.Tecnologias)
            .HasMaxLength(1000);

        entity.Property(x => x.EnlaceRepositorio)
            .HasMaxLength(2048);

        entity.Property(x => x.EnlaceDemostracion)
            .HasMaxLength(2048);

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.Proyectos)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasIndex(x => x.UsuarioId);
    }
}
