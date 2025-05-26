using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagerServer.Models;
using TaskManagerServer.Services;

namespace TaskManagerServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TaskCardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly SupabaseStorageService _storageService;

        public TaskCardController(AppDbContext context, SupabaseStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id");
            return userIdClaim != null ? int.Parse(userIdClaim.Value) : 0;
        }

        [HttpPost("create")]
        [Authorize]
        public async Task<IActionResult> CreateTask([FromForm] TaskCardCreateDto dto)
        {
            var creatorId = GetUserId();

            var creator = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == creatorId);

            if (creator == null)
                return Unauthorized("Пользователь не найден.");

            var targetUser = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == dto.TargetUserId);

            if (targetUser == null)
                return BadRequest("Назначаемый пользователь не найден.");

            if (creator.Role.Name == "Employer")
            {
                if (creator.DepartmentId != targetUser.DepartmentId)
                    return Forbid("Вы можете назначать задания только сотрудникам своего отдела.");
            }
            else if (creator.Role.Name == "TopeEmployer")
            {
                if (!(targetUser.Role.Name == "Employer" || targetUser.DepartmentId == null))
                    return Forbid("Вы можете назначать задания только Employer или сотрудникам без отдела.");
            }
            else
            {
                return Forbid("У вас нет прав для создания заданий.");
            }

            var task = new TaskCard
            {
                Title = dto.Title,
                Description = dto.Description,
                EmployerId = creator.Id,
                Deadline = dto.Deadline,
                FileUrl = dto.FileUrl
            };

            // Добавь это свойство в модель TaskCard
            typeof(TaskCard).GetProperty("TargetUserId")?.SetValue(task, dto.TargetUserId);

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return Ok(new { taskId = task.Id });
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized("Не удалось определить пользователя.");

            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
                return NotFound("Задание не найдено.");

            if (task.EmployerId != userId)
                return Forbid("Вы можете удалять только свои задания.");

            if (!string.IsNullOrEmpty(task.FileUrl))
            {
                try
                {
                    var fileName = Path.GetFileName(new Uri(task.FileUrl).AbsolutePath);
                    await _storageService.DeleteFileAsync(fileName);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Ошибка удаления файла: {ex}");
                }
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return Ok("Задание и файл удалены.");
        }
    }
}
