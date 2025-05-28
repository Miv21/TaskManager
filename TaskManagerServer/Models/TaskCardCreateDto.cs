using System.ComponentModel.DataAnnotations;

namespace TaskManagerServer.Models
{
    public class TaskCardCreateDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } = string.Empty;

        [Required]
        public int TargetUserId { get; set; }

        public string? FileUrl { get; set; }

        [Required]
        public DateTime Deadline { get; set; }
    }
}
