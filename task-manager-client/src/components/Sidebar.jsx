import React from 'react';
import { Box, VStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <Box 
      h="78%" 
      bg="rgb(115, 113, 113)" 
      p={4}
      borderRadius="25" 
      boxShadow="0 0 10px rgba(0, 0, 0, 0.1)" 
    >
      <VStack spacing={4} align="stretch">
        <Button onClick={() => navigate('/tasks')}>Карточки</Button>
        <Button onClick={() => navigate('/admin')}>Админ‑панель</Button>
      </VStack>
    </Box>
  );
}