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

        [HttpPut("{id}/login")]
        public async Task<IActionResult> ChangeLogin(int id, [FromBody] ChangeLoginDto dto)
        {
            var user = await _ctx.Users.FindAsync(id);
            if (user == null) return NotFound();

            var res = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.CurrentPassword);
            if (res == PasswordVerificationResult.Failed)
                return BadRequest("Неверный текущий пароль");

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
}
