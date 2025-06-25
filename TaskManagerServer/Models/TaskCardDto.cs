namespace TaskManagerServer.Models
{
    public class TaskCardDto
    {
        public int? TaskId { get; set; }
        public int? ResponseId { get; set; }
        public string Title { get; set; } = default!;
        public string Description { get; set; } = default!;
        public string? ResponseText { get; set; }
        public DateTime Deadline { get; set; }
        public DateTime TaskCreationTime { get; set; }
        public string? FileUrl { get; set; }
        public string? OriginalFileUrl { get; set; }
        public int? TargetUserId { get; set; }
        public string Type { get; set; } = default!;
    }
}
