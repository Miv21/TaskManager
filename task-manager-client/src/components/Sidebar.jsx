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
      boxShadow= "2px 6px 8px 1px rgba(0, 0, 0, 0.20)" 
    >
      <VStack spacing={4} align="stretch" borderTopWidth="71px" borderTopColor="polar.50">
        <Button borderRadius="25" boxShadow= "0px 6px 5px 0px rgba(0, 0, 0, 0.40)" height="50px" onClick={() => navigate('/tasks')}>Карточки</Button>
        {user?.role === 'Admin' && (
          <Button borderRadius="25" boxShadow= "0px 6px 5px 0px rgba(0, 0, 0, 0.40)" height="50px" onClick={() => navigate('/admin')}>
            Админ‑панель
          </Button>
        )}
      </VStack>
    </Box>
  );
}