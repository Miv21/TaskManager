namespace TaskManagerServer.Models
{
    public class Position
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public ICollection<User> Users { get; set; }
    }
}
