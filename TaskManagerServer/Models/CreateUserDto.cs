using System.ComponentModel.DataAnnotations;

namespace TaskManagerServer.Models
{
    public class CreateUserDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Login { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;    
        public string? Password { get; set; } = string.Empty;    
        public int RoleId { get; set; }
        public int? DepartmentId { get; set; }
        public int PositionId { get; set; }
    }
}
