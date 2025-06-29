﻿using Microsoft.AspNetCore.Authorization;
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
        public async Task<IActionResult> GetUserTasksAndResponses()
        {
            var userId = GetUserId();

            var myTasks = await _context.Tasks
                .Where(t => t.TargetUserId == userId)
                .Select(t => new TaskCardDto
                {
                    TaskId = t.Id,  
                    ResponseId = null,
                    Title = t.Title,
                    Description = t.Description,
                    Deadline = t.Deadline,
                    FileUrl = t.FileUrl,
                    TargetUserId = t.TargetUserId,
                    Type = "MyTasks"
                })
                .ToListAsync();

            var createdTasks = await _context.Tasks
                .Where(t => t.EmployerId == userId)
                .Select(t => new TaskCardDto
                {
                    TaskId = t.Id,       
                    ResponseId = null,
                    Title = t.Title,
                    Description = t.Description,
                    Deadline = t.Deadline,
                    FileUrl = t.FileUrl,
                    TargetUserId = t.TargetUserId,
                    Type = "CreatedTasks"
                })
                .ToListAsync();

            var myResponses = await _context.TaskResponses
                .Where(r => r.EmployeeId == userId)
                .Select(r => new TaskCardDto
                {
                    TaskId = null,   
                    ResponseId = r.Id,
                    Title = r.Title,
                    Description = r.Description,
                    ResponseText = r.ResponseText,
                    Deadline = r.Deadline,
                    TaskCreationTime = r.SubmittedAt,
                    FileUrl = r.FileUrl,
                    OriginalFileUrl = r.OriginalFileUrl,
                    TargetUserId = null,
                    Type = "MyResponses"
                })
                .ToListAsync();

            var responsesToMyTasks = await _context.TaskResponses
                .Where(r => r.EmployerId == userId)
                .Select(r => new TaskCardDto
                {
                    TaskId = null,
                    ResponseId = r.Id,
                    Title = r.Title,
                    Description = r.Description,
                    ResponseText = r.ResponseText,
                    Deadline = r.Deadline,
                    TaskCreationTime = r.SubmittedAt,
                    FileUrl = r.FileUrl,
                    OriginalFileUrl = r.OriginalFileUrl,
                    TargetUserId = null,
                    Type = "ResponsesToMyTasks"
                })
                .ToListAsync();

            var allCards = myTasks
                .Concat(createdTasks)
                .Concat(myResponses)
                .Concat(responsesToMyTasks)
                .ToList();

            return Ok(allCards);
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

        [HttpGet("file-link/{id}")]
        [Authorize]
        public async Task<IActionResult> GetFileUrl(int id)
        {
            var task = await _context.Tasks.FindAsync(id);

            if (task == null)
                return NotFound("Задание не найдено.");

            if (string.IsNullOrEmpty(task.FileUrl))
                return NotFound("Файл не прикреплён к заданию.");

            return Ok(new { fileUrl = task.FileUrl });
        }

        [HttpGet("response-file-link/{responseId}")]
        [Authorize]
        public async Task<IActionResult> GetTaskResponseFileUrl(int responseId, [FromQuery] string fileType)
        {
            var taskResponse = await _context.TaskResponses.FindAsync(responseId);

            if (taskResponse == null)
                return NotFound("Ответ не найден.");

            string fileUrlToReturn = null;
            string message = "";

            if (fileType == "originalTask")
            {
                if (!string.IsNullOrEmpty(taskResponse.OriginalFileUrl))
                {
                    fileUrlToReturn = taskResponse.OriginalFileUrl;
                    message = "Файл оригинального задания";
                }
                else
                {
                    return NotFound("Файл оригинального задания не прикреплён к этому ответу.");
                }
            }
            else if (fileType == "response") 
            {
                if (!string.IsNullOrEmpty(taskResponse.FileUrl))
                {
                    fileUrlToReturn = taskResponse.FileUrl;
                    message = "Файл ответа";
                }
                else
                {
                    return NotFound("Файл ответа не прикреплён к этому ответу.");
                }
            }
            else
            {
                return BadRequest("Неверный тип файла. Укажите 'originalTask' или 'response'.");
            }

            if (string.IsNullOrEmpty(fileUrlToReturn))
            {
                return NotFound($"Файл не найден для указанного типа: {fileType}.");
            }

            return Ok(new { fileUrl = fileUrlToReturn, message = message });
        }

        [HttpPost("respond")]
        [Authorize]
        public async Task<IActionResult> RespondToTask([FromForm] TaskResponseCreateDto dto)
        {
            var userId = GetUserId();

            var task = await _context.Tasks
                .Include(t => t.Employer)
                .FirstOrDefaultAsync(t => t.Id == dto.TaskId);

            if (task == null)
                return NotFound("Задание не найдено.");

            if (task.TargetUserId != userId)
                return Forbid("Вы не можете отвечать на это задание.");


            var response = new TaskResponse
            {
                EmployeeId = userId,
                ResponseText = dto.ResponseText,
                FileUrl = dto.FileUrl,
                SubmittedAt = DateTime.UtcNow,

                EmployerId = task.EmployerId,
                Title = task.Title,
                Description = task.Description,
                Deadline = task.Deadline,
                OriginalFileUrl = task.FileUrl
            };

            _context.TaskResponses.Add(response);
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
