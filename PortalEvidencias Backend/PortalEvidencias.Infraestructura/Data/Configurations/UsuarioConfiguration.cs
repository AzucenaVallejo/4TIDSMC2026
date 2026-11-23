
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> entity)
    {
        entity.ToTable("Usuarios");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Correo)
            .HasMaxLength(256)
            .IsRequired();

        entity.Property(x => x.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        entity.Property(x => x.FechaCreacion)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasIndex(x => x.Correo).IsUnique();
    }
}
