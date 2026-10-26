using Infrastructure.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;

namespace API.Tests;

public class MigrationChainTests
{
    [Fact]
    public void Followup_migration_does_not_recreate_or_drop_indexes_owned_by_predecessor()
    {
        var predecessor = new Manjaro();
        var followup = new FixOrderTrackingAndDecimalPrecision();

        Assert.Equal(3, predecessor.UpOperations.OfType<CreateIndexOperation>().Count());
        Assert.Empty(followup.UpOperations);
        Assert.Empty(followup.DownOperations);
    }
}
