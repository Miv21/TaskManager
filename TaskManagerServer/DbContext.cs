using Microsoft.EntityFrameworkCore;
using TaskManagerServer.Models;

namespace TaskManagerServer
{
    public class AppDbContext : DbContext
    {
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<TaskCard> Tasks { get; set; }
        public DbSet<TaskResponse> TaskResponses { get; set; }
        public DbSet<Position> Positions { get; set; }
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, Name = "Employer" },
                new Role { Id = 2, Name = "Employee" },
                new Role { Id = 3, Name = "Admin" }
            );
        }
    }
}
