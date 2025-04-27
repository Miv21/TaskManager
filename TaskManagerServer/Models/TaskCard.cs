namespace TaskManagerServer.Models
{
    public class TaskCard
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public int EmployerId { get; set; }
        public User Employer { get; set; }

        public string? FileUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime Deadline { get; set; }

        public ICollection<TaskResponse> Responses { get; set; }
    }
}
