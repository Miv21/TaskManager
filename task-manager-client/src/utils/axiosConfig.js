import axios from 'axios';

// Создаём экземпляр
const api = axios.create({
  baseURL: '/api', // укажи свой базовый URL, если нужен
});

// 👉 Добавляем интерцептор запроса
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 👉 Добавляем интерцептор ответа (например, для обработки 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Можно удалить токен и перекинуть на /login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;