using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
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
                Deadline = DateTime.SpecifyKind(dto.Deadline, DateTimeKind.Local).ToUniversalTime(),
                CreatedAt = DateTime.UtcNow,
                FileUrl = dto.FileUrl,
                TargetUserId = dto.TargetUserId
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return Ok(new { taskId = task.Id });
        }

        [HttpDelete("delete/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userId = GetUserId();
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

        [HttpGet("available")]
        [Authorize]
        public async Task<IActionResult> GetAvailableUsers()
        {
            var currentUserId = GetUserId();
            var currentUser = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Id == currentUserId);

            if (currentUser == null)
                return Unauthorized("Пользователь не найден.");

            IQueryable<User> query;

            if (currentUser.Role.Name == "Employer")
            {
                query = _context.Users
                    .Where(u => u.DepartmentId == currentUser.DepartmentId && u.Id != currentUser.Id);
            }
            else if (currentUser.Role.Name == "TopeEmployer")
            {
                query = _context.Users
                    .Where(u => u.Role.Name == "Employer" || u.DepartmentId == null);
            }
            else
            {
                return Forbid("У вас нет прав для получения списка пользователей.");
            }

            var users = await query
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("card")]
        [Authorize]
        public async Task<IActionResult> GetUserTasks()
        {
            var userId = GetUserId();
            var tasks = await _context.Tasks
                .Where(t => t.TargetUserId == userId || t.EmployerId == userId)
                .Include(t => t.Employer)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Description,
                    t.CreatedAt,
                    t.Deadline,
                    t.FileUrl,
                    EmployerName = t.Employer.Name,
                    IsCreatedByMe = t.EmployerId == userId,
                    t.EmployerId,           
                    t.TargetUserId          
                })
                .ToListAsync();

            return Ok(tasks);
        }

        [HttpPut("update")]
        [Authorize]
        public async Task<IActionResult> UpdateTask([FromForm] TaskCardUpdateDto dto)
        {
            var task = await _context.Tasks.FindAsync(dto.Id);
            if (task == null)
                return NotFound("Задание не найдено.");

            task.Title = dto.Title;
            task.Description = dto.Description;
            task.Deadline = dto.Deadline;
            task.TargetUserId = dto.TargetUserId;

            if (!string.IsNullOrWhiteSpace(dto.FileUrl))
                task.FileUrl = dto.FileUrl;

            if (!string.IsNullOrEmpty(dto.FileUrl))
                task.FileUrl = dto.FileUrl;

            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
