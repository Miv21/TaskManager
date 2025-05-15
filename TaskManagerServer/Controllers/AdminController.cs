using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TaskManagerServer.Models;

namespace TaskManagerServer.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPasswordHasher<User> _hasher;

        public AdminController(AppDbContext context, IPasswordHasher<User> hasher)
        {
            _context = context;
            _hasher = hasher;
        }

        // GET api/admin/users
        [HttpGet("users")]
        public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
        {
            var list = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .Include(u => u.Position)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Login = u.Login,
                    Email = u.Email,
                    RoleId = u.RoleId,
                    RoleName = u.Role.Name,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department != null ? u.Department.Name : null,
                    PositionId = u.PositionId,
                    PositionName = u.Position.Name
                })
                .ToListAsync();

            return Ok(list);
        }

        // POST api/admin/users
        [HttpPost("users")]
        public async Task<ActionResult<User>> CreateUser([FromBody] CreateUserDto dto)
        {
            var user = new User
            {
                Name = dto.FullName,
                Login = dto.Login,
                Email = dto.Email,
                RoleId = dto.RoleId,
                DepartmentId = dto.DepartmentId,
                PositionId = dto.PositionId,
                PasswordHash = _hasher.HashPassword(null!, dto.Password ?? string.Empty)
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, user);
        }

        // PUT api/admin/users/{id}
        [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] CreateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            user.Name = dto.FullName;
            user.Login = dto.Login;
            user.Email = dto.Email;
            user.RoleId = dto.RoleId;
            user.DepartmentId = dto.DepartmentId;
            user.PositionId = dto.PositionId;

            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE api/admin/users/{id}
        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DEPARTMENTS
        [HttpGet("departments")]
        public async Task<ActionResult<IEnumerable<Department>>> GetDepartments()
            => Ok(await _context.Departments.ToListAsync());

        [HttpPost("departments")]
        public async Task<ActionResult<Department>> CreateDepartment(Department dept)
        {
            _context.Departments.Add(dept);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDepartments), new { id = dept.Id }, dept);
        }

        [HttpPut("departments/{id}")]
        public async Task<IActionResult> UpdateDepartment(int id, Department updated)
        {
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null) return NotFound();
            dept.Name = updated.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("departments/{id}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var dept = await _context.Departments.FindAsync(id);
            if (dept == null) return NotFound();
            _context.Departments.Remove(dept);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POSITIONS
        [HttpGet("positions")]
        public async Task<ActionResult<IEnumerable<Position>>> GetPositions()
            => Ok(await _context.Positions.ToListAsync());

        [HttpPost("positions")]
        public async Task<ActionResult<Position>> CreatePosition(Position pos)
        {
            _context.Positions.Add(pos);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetPositions), new { id = pos.Id }, pos);
        }

        [HttpPut("positions/{id}")]
        public async Task<IActionResult> UpdatePosition(int id, Position updated)
        {
            var pos = await _context.Positions.FindAsync(id);
            if (pos == null) return NotFound();
            pos.Name = updated.Name;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("positions/{id}")]
        public async Task<IActionResult> DeletePosition(int id)
        {
            var pos = await _context.Positions.FindAsync(id);
            if (pos == null) return NotFound();
            _context.Positions.Remove(pos);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
