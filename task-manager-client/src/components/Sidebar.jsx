import React from 'react';
import { Box, VStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Box 
      h="100%" 
      bg="polar.50" 
      p={4}
      borderRadius="25" 
      boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" 
    >
      <VStack spacing={4} align="stretch">
        <Button onClick={() => navigate('/tasks')}>Карточки</Button>
        {user?.role === 'Admin' && (
          <Button onClick={() => navigate('/admin')}>
            Админ‑панель
          </Button>
        )}
      </VStack>
    </Box>
  );
}