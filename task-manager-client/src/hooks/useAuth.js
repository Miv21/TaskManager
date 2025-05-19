import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Загружаем пользователя из токена при инициализации
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // В JWT роль хранится в поле role или ClaimTypes.Role
        // Уточните поле в вашем токене, например:
        const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        setUser({ id: decoded.sub, email: decoded.email, role, token });
      } catch {
        // Если токен битый, очистить
        localStorage.removeItem('token');
        setUser(null);
      }
    }
  }, []);

  // Функция для входа — сохраняет токен и парсит юзера
  const login = (token) => {
    localStorage.setItem('token', token);
    try {
      const decoded = jwtDecode(token);
      const role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      setUser({ id: decoded.sub, email: decoded.email, role, token });
    } catch {
      setUser(null);
    }
  };

  // Функция выхода — удаляет токен и пользователя
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для доступа к auth-данным
export function useAuth() {
  return useContext(AuthContext);
}