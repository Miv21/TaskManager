using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagerServer.Models;

namespace TaskManagerServer.Controllers
{
    [ApiController]
    [Route("api/me")]
    [Authorize]
    public class MeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MeController(AppDbContext context)
        {
            _context = context;
        }

        // GET api/me
        [HttpGet]
        public async Task<IActionResult> GetCurrentUser()
        {
            // получаем id пользователя из JWT
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userIdClaim == null)
                return Unauthorized();

            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            // загружаем все связи
            var u = await _context.Users
                .Include(x => x.Role)
                .Include(x => x.Department)
                .Include(x => x.Position)
                .FirstOrDefaultAsync(x => x.Id == userId);

            if (u == null)
                return NotFound();

            // конвертируем байты в Base64 (если есть)
            string? avatarBase64 = null;
            if (u.Avatar is { Length: > 0 } && !string.IsNullOrEmpty(u.AvatarContentType))
            {
                avatarBase64 = $"data:{u.AvatarContentType};base64," +
                               Convert.ToBase64String(u.Avatar);
            }

            return Ok(new
            {
                id = u.Id,
                name = u.Name,
                login = u.Login,
                email = u.Email,
                positionName = u.Position.Name,
                departmentName = u.Department?.Name,
                avatarBase64     
            });
        }
    }
}