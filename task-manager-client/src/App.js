import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/AppLayout';
import AdminPanel from './pages/AdminPanel';
import TasksPage from './pages/TasksPage';


function App() {
  return (
    <Routes>
      {/* Весь UI обёрнут в общий Layout */}
      <Route path="/" element={<AppLayout />}>
        {/* по умолчанию редиректим куда-нибудь */}
        <Route index element={<Navigate to="/tasks" replace />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="tasks" element={<TasksPage />} />
      </Route>
      {/* на случай 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;