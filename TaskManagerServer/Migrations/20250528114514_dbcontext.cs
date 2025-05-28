using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskManagerServer.Migrations
{
    /// <inheritdoc />
    public partial class dbcontext : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskResponses_Users_EmployeeId",
                table: "TaskResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_EmployerId",
                table: "Tasks");

            migrationBuilder.AddColumn<int>(
                name: "TargetUserId",
                table: "Tasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tasks_TargetUserId",
                table: "Tasks",
                column: "TargetUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskResponses_Users_EmployeeId",
                table: "TaskResponses",
                column: "EmployeeId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_EmployerId",
                table: "Tasks",
                column: "EmployerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_TargetUserId",
                table: "Tasks",
                column: "TargetUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskResponses_Users_EmployeeId",
                table: "TaskResponses");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_EmployerId",
                table: "Tasks");

            migrationBuilder.DropForeignKey(
                name: "FK_Tasks_Users_TargetUserId",
                table: "Tasks");

            migrationBuilder.DropIndex(
                name: "IX_Tasks_TargetUserId",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "TargetUserId",
                table: "Tasks");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskResponses_Users_EmployeeId",
                table: "TaskResponses",
                column: "EmployeeId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Tasks_Users_EmployerId",
                table: "Tasks",
                column: "EmployerId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
