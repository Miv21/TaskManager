namespace TaskManagerServer.Models
{
    public class TaskResponseCreateDto
    {
        public int TaskId { get; set; }
        public string ResponseText { get; set; } = string.Empty;
        public string? FileUrl { get; set; }
    }
}
