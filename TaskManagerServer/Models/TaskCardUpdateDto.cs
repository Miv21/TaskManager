namespace TaskManagerServer.Models
{
    public class TaskCardUpdateDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public DateTime Deadline { get; set; }
        public int TargetUserId { get; set; }
        public string? FileUrl { get; set; }
    }
}
