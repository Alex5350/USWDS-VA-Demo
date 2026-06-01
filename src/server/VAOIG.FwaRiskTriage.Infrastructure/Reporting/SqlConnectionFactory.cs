using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;

namespace VAOIG.FwaRiskTriage.Infrastructure.Reporting;

public sealed class SqlConnectionFactory(IConfiguration configuration)
{
    public IDbConnection CreateConnection()
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");

        return new SqlConnection(connectionString);
    }
}
