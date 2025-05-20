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

        [HttpPut("{id}/avatar")]
        public async Task<IActionResult> UpdateAvatar(int id, [FromBody] AvatarDto dto)
        {
            var user = await _ctx.Users.FindAsync(id);
            if (user == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Base64))
                return BadRequest("Изображение не передано.");

            try
            {
                var parts = dto.Base64.Split(',');
                var base64Data = parts.Length > 1 ? parts[1] : parts[0];

                user.Avatar = Convert.FromBase64String(base64Data);
                user.AvatarContentType = GetContentTypeFromBase64(dto.Base64);

                await _ctx.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest($"Ошибка при сохранении аватара: {ex.Message}");
            }
        }

        private string GetContentTypeFromBase64(string base64String)
        {
            if (base64String.StartsWith("data:image/png")) return "image/png";
            if (base64String.StartsWith("data:image/jpeg")) return "image/jpeg";
            if (base64String.StartsWith("data:image/webp")) return "image/webp";
            return "application/octet-stream";
        }
    }
}
