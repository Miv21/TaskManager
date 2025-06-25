namespace TaskManagerServer.Models
{
    public class TaskResponse
    {
        public int Id { get; set; }

        public int EmployeeId { get; set; }
        public int EmployerId { get; set; }
        public User Employee { get; set; }

        public string ResponseText { get; set; } = string.Empty;

        public string? FileUrl { get; set; }

        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

        //Поля, копируемые из TaskCard:
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime Deadline { get; set; }
        public string? OriginalFileUrl { get; set; }
    }
}
