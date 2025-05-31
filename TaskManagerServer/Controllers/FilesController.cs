using Microsoft.AspNetCore.Mvc;
using TaskManagerServer.Services;


namespace TaskManagerServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FilesController : ControllerBase
    {
        private readonly SupabaseStorageService _storageService;

        public FilesController(SupabaseStorageService storageService)
        {
            _storageService = storageService;
        }

        [HttpPost("upload-files")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Файл не выбран.");

            using var stream = file.OpenReadStream();
            var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName); 
            var fileUrl = await _storageService.UploadFileAsync(fileName, stream);

            return Ok(new { fileUrl });
        }

        [HttpDelete("delete-files/{fileName}")]
        public async Task<IActionResult> DeleteAvatar(string fileName)
        {
            await _storageService.DeleteFileAsync(fileName);
            return Ok("Файл успешно удалён.");
        }
    }
}
