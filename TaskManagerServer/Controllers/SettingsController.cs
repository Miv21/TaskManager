using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using TaskManagerServer.Models;

namespace TaskManagerServer.Controllers
{
    [ApiController]
    [Route("api/users")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _ctx;
        private readonly IPasswordHasher<User> _hasher;

        public SettingsController(AppDbContext ctx, IPasswordHasher<User> hasher)
        {
            _ctx = ctx;
            _hasher = hasher;
        }

        // Новый endpoint для валидации текущего пароля
        [HttpPost("{id}/validate-password")]
        public async Task<IActionResult> ValidatePassword(int id, [FromBody] ValidatePasswordDto dto)
        {
            var user = await _ctx.Users.FindAsync(id);
            if (user == null) return NotFound();

            var res = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (res == PasswordVerificationResult.Failed)
                return BadRequest("Неверный текущий пароль");

            return Ok();
        }

        [HttpPut("{id}/login")]
        public async Task<IActionResult> ChangeLogin(int id, [FromBody] ChangeLoginDto dto)
        {
            var user = await _ctx.Users.FindAsync(id);
            if (user == null) return NotFound();

            // пароль уже проверён на предыдущем шаге, но можем перепроверить
            var res = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (res == PasswordVerificationResult.Failed)
                return BadRequest("Неверный текущий пароль");

            // проверка уникальности
            if (_ctx.Users.Any(u => u.Login == dto.NewLogin && u.Id != id))
                return BadRequest("Логин уже занят");

            user.Login = dto.NewLogin;
            await _ctx.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/password")]
        public async Task<IActionResult> ChangePassword(int id, [FromBody] ChangePasswordDto dto)
        {
            var user = await _ctx.Users.FindAsync(id);
            if (user == null) return NotFound();

            var res = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (res == PasswordVerificationResult.Failed)
                return BadRequest("Неверный текущий пароль");

            user.PasswordHash = _hasher.HashPassword(user, dto.NewPassword);
            await _ctx.SaveChangesAsync();
            return NoContent();
        }
    }

    // DTO для validate-password
    public class ValidatePasswordDto
    {
        public string CurrentPassword { get; set; } = "";
    }

    public class ChangeLoginDto
    {
        public string CurrentPassword { get; set; } = "";
        public string NewLogin { get; set; } = "";
    }

    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; } = "";
        public string NewPassword { get; set; } = "";
    }
}
