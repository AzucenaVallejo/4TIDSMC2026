
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class PerfilConfiguration : IEntityTypeConfiguration<Perfil>
{
    public void Configure(EntityTypeBuilder<Perfil> entity)
    {
        entity.ToTable("Perfiles");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Nombres)
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(x => x.ApellidoPaterno)
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(x => x.ApellidoMaterno)
            .HasMaxLength(100)
            .IsRequired();

        entity.Property(x => x.Telefono)
            .HasMaxLength(25);

        entity.Property(x => x.Biografia)
            .HasMaxLength(2000);

        entity.Property(x => x.FotografiaUrl)
            .HasMaxLength(2048);

        entity.HasIndex(x => x.UsuarioId)
            .IsUnique();

        entity.HasOne(x => x.Usuario)
            .WithOne(x => x.Perfil)
            .HasForeignKey<Perfil>(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(x => x.Fotografia)
            .WithMany()
            .HasForeignKey(x => x.DocumentoFotografiaId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
