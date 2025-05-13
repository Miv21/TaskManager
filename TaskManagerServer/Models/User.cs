using System.ComponentModel.DataAnnotations;

namespace TaskManagerServer.Models
{
    public class User
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string Login { get; set; } = string.Empty; 

        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public int RoleId { get; set; }
        public Role Role { get; set; } = null!;

        public int? DepartmentId { get; set; }
        public Department? Department { get; set; }

        public int PositionId { get; set; }
        public Position Position { get; set; } = null!;

        public byte[]? Avatar { get; set; }
        public string? AvatarContentType { get; set; }

        public ICollection<TaskCard>? CreatedTasks { get; set; }
        public ICollection<TaskResponse>? Responses { get; set; }
    }
}
