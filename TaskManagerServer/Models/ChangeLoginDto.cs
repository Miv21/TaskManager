namespace TaskManagerServer.Models
{
    public class ChangeLoginDto
    {
        public string CurrentPassword { get; set; } = "";
        public string NewLogin { get; set; } = "";
    }
}
