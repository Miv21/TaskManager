using Microsoft.EntityFrameworkCore;
using System.Data;
using TaskManagerServer.Models;

namespace TaskManagerServer
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<TaskCard> Tasks { get; set; }
        public DbSet<TaskResponse> TaskResponses { get; set; }
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    }
}
