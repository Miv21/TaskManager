namespace TaskManagerServer.Models
{
    public class TaskResponse
    {
        public int Id { get; set; }

        public int TaskId { get; set; }
        public TaskCard Task { get; set; }

        public int EmployeeId { get; set; }
        public User Employee { get; set; }

        public string ResponseText { get; set; } = string.Empty;

        public string? FileUrl { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    }
}
