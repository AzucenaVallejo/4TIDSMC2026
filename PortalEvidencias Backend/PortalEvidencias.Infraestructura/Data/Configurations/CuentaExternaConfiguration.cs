
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PortalEvidencias.Dominio.Entities;

namespace PortalEvidencias.Infraestructura.Data.Configurations;

public class CuentaExternaConfiguration : IEntityTypeConfiguration<CuentaExterna>
{
    public void Configure(EntityTypeBuilder<CuentaExterna> entity)
    {
        entity.ToTable("CuentasExternas");
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Proveedor)
            .HasConversion<int>()
            .IsRequired();

        entity.Property(x => x.IdentificadorExterno)
            .HasMaxLength(255)
            .IsRequired();

        entity.Property(x => x.CorreoProveedor)
            .HasMaxLength(256);

        entity.Property(x => x.FechaVinculacion)
            .HasDefaultValueSql("SYSUTCDATETIME()");

        entity.HasIndex(x => new
        {
            x.Proveedor,
            x.IdentificadorExterno
        }).IsUnique();

        entity.HasOne(x => x.Usuario)
            .WithMany(x => x.CuentasExternas)
            .HasForeignKey(x => x.UsuarioId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
