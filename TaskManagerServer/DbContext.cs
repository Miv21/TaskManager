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
                new Role { Id = 3, Name = "Admin" },
                new Role { Id = 4, Name = "TopeEmployer" }
            );

            // Связь TaskCard -> Employer
            modelBuilder.Entity<TaskCard>()
                .HasOne(t => t.Employer)
                .WithMany(u => u.CreatedTasks)
                .HasForeignKey(t => t.EmployerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Связь TaskCard -> TargetUser 
            modelBuilder.Entity<TaskCard>()
                .HasOne(t => t.TargetUser)
                .WithMany()
                .HasForeignKey(t => t.TargetUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Связь TaskResponse -> TaskCard
            modelBuilder.Entity<TaskResponse>()
                .HasOne(r => r.Task)
                .WithMany(t => t.Responses)
                .HasForeignKey(r => r.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskResponse → Employee
            modelBuilder.Entity<TaskResponse>()
                .HasOne(r => r.Employee)
                .WithMany(u => u.Responses)
                .HasForeignKey(r => r.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
