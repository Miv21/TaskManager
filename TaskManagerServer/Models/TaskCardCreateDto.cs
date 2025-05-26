namespace TaskManagerServer.Models
{
    public class TaskCardCreateDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int TargetUserId { get; set; }
        public string? FileUrl { get; set; }
        public DateTime Deadline { get; set; }
    }
}
