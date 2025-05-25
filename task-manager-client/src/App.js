import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import AdminPanel from './pages/AdminPanel';
import TasksPage from './pages/TasksPage';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';

// Хук для проверки авторизации
function useAuth() {
  const token = localStorage.getItem('token');
  return !!token;
}

// Компонент защищённого маршрута
function PrivateRoute() {
  const isAuth = useAuth();
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <Routes>
      {/* Публичный маршрут логина */}
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        {/* Защищённые маршруты */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="admin" element={<AdminPanel />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Фоллбек на всё остальное */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;