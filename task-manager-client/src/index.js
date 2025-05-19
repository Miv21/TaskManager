import React from 'react';
import { createRoot } from 'react-dom/client';     
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './hooks/useAuth'; // <-- правильный импорт AuthProvider

const container = document.getElementById('root');
if (!container) {
  throw new Error('Не найден <div id="root"> в public/index.html');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ChakraProvider>
      <BrowserRouter>
        <AuthProvider>  
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>
);