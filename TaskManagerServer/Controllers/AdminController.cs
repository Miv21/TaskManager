using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManagerServer.Models;

namespace TaskManagerServer.Controllers
{
    //[Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminController(AppDbContext context)
        {
            _context = context;
        }

        // Получить список всех пользователей
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.Include(u => u.Role).Include(u => u.Department).ToListAsync();
        }

        [HttpPost("users")]
        public async Task<ActionResult<User>> CreateUser(User user)
        {
            // Здесь можно дополнительно добавить валидацию (например, проверку Email)
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
        }

        // Удалить пользователя по id
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
                return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("departments")]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
        {
            return await _context.Departments.ToListAsync();
        }

        [HttpPost("departments")]
        public async Task<ActionResult<Department>> CreateDepartment(Department department)
        {
            _context.Departments.Add(department);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDepartments), new { id = department.Id }, department);
        }

        [HttpPut("departments/{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, Department updatedDepartment)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound();

            department.Name = updatedDepartment.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("departments/{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Departments.FindAsync(id);
            if (department == null) return NotFound();

            _context.Departments.Remove(department);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Управление должностями

        [HttpGet("positions")]
        public async Task<ActionResult<IEnumerable<Position>>> GetPositions()
        {
            return await _context.Positions.ToListAsync();
        }

        [HttpPost("positions")]
        public async Task<ActionResult<Position>> CreatePosition(Position position)
        {
            _context.Positions.Add(position);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPositions), new { id = position.Id }, position);
        }

        [HttpPut("positions/{id}")]
        public async Task<IActionResult> UpdatePosition(int id, Position updatedPosition)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null) return NotFound();

            position.Name = updatedPosition.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("positions/{id}")]
        public async Task<IActionResult> DeletePosition(int id)
        {
            var position = await _context.Positions.FindAsync(id);
            if (position == null) return NotFound();

            _context.Positions.Remove(position);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
