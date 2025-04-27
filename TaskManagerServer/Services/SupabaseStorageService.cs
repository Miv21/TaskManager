using System.Net.Http.Headers;

namespace TaskManagerServer.Services
{
    public class SupabaseStorageService
    {
        private readonly HttpClient _httpClient;
        private readonly string _supabaseUrl;
        private readonly string _supabaseApiKey;
        private readonly string _bucketName;

        public SupabaseStorageService(IConfiguration configuration)
        {
            _httpClient = new HttpClient();
            _supabaseUrl = configuration["Supabase:Url"];
            _supabaseApiKey = configuration["Supabase:ApiKey"];
            _bucketName = configuration["Supabase:BucketName"];
        }

        public async Task<string> UploadFileAsync(string fileName, Stream fileStream)
        {
            var requestUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{fileName}";

            var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
            {
                Content = new StreamContent(fileStream)
            };
            request.Content.Headers.ContentType = new MediaTypeHeaderValue("application/octet-stream");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseApiKey);

            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                return $"{_supabaseUrl}/storage/v1/object/public/{_bucketName}/{fileName}";
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Ошибка загрузки файла: {error}");
            }
        }

        public async Task DeleteFileAsync(string fileName)
        {
            var requestUrl = $"{_supabaseUrl}/storage/v1/object/{_bucketName}/{fileName}";
            var request = new HttpRequestMessage(HttpMethod.Delete, requestUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _supabaseApiKey);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Ошибка удаления файла: {error}");
            }
        }
    }
}
