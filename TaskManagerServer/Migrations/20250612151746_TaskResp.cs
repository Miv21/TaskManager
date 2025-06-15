using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagerServer.Migrations
{
    /// <inheritdoc />
    public partial class TaskResp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmployerId",
                table: "TaskResponses",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployerId",
                table: "TaskResponses");
        }
    }
}
