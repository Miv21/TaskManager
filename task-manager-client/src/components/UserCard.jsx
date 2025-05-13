import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Text,
  VStack,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import axios from 'axios';

export default function UserCard() {
  const [user, setUser] = useState(null);
  const toast = useToast();

  useEffect(() => {
    axios.get('/api/me')
      .then(res => setUser(res.data))
      .catch(() =>
        toast({
          status: 'error',
          description: 'Не удалось загрузить данные пользователя',
        })
      );
  }, []);

  if (!user) {
    return (
      <Box
        bg="grey"
        height="fit-content"
        p={4}
        borderRadius="25px"
        boxShadow="0 0 10px rgba(0,0,0,0.1)"
        width="280px"
        h="22"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner />
      </Box>
    );
  }

  // Собираем data URL для <Avatar>
  const avatarSrc = user.avatarBase64
    ? `data:image/png;base64,${user.avatarBase64}`
    : undefined;

  return (
    <Box
      bg="grey"
      height="fit-content"
      p={4}
      borderRadius="25px"
      boxShadow="0 0 10px rgba(0,0,0,0.1)"
      width="280px"
      h="22"
    >
      <VStack spacing={2} align="center">
        <Avatar
          size="xl"
          name={user.name}
          src={avatarSrc}
        />
        <Text fontSize="lg" fontWeight="bold">
          {user.name}
        </Text>
        <Text color="gray.600">
          @{user.login}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {user.roleName}
        </Text>
        {user.departmentName && (
          <Text fontSize="sm" color="gray.500">
            {user.departmentName}
          </Text>
        )}
      </VStack>
    </Box>
  );
}