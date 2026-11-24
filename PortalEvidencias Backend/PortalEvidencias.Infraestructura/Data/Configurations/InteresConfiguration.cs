using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Persistence.Configurations;

public class InteresConfiguration : IEntityTypeConfiguration<Interes>
{
    public void Configure(EntityTypeBuilder<Interes> builder)
    {
        builder.ToTable("Intereses");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.Nombre)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(i => i.Descripcion)
            .HasMaxLength(1000);

        builder.Property(i => i.Icono)
            .HasMaxLength(100);

        builder.Property(i => i.Categoria)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(i => i.CategoriaPersonalizada)
            .HasMaxLength(100);

        builder.Property(i => i.Tipo)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(i => i.Frecuencia)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(i => i.IncludePublic)
            .IsRequired();

        builder.Property(i => i.IncludeCV)
            .IsRequired();

        builder.Property(i => i.FechaCreacion)
            .IsRequired();

        builder.Property(i => i.FechaActualizacion)
            .IsRequired(false);

        builder.HasOne(i => i.Usuario)
            .WithMany(u => u.Intereses)
            .HasForeignKey(i => i.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasIndex(i => new { i.UsuarioId, i.Nombre })
            .IsUnique();
    }
}