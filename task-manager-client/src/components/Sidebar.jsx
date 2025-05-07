import React from 'react';
import { Box, VStack, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <Box w="250px" bg="white" shadow="md" p={4}>
      <VStack spacing={4} align="stretch">
        <Button onClick={() => navigate('/tasks')}>Карточки</Button>
        <Button onClick={() => navigate('/admin')}>Админ‑панель</Button>
      </VStack>
    </Box>
  );
}