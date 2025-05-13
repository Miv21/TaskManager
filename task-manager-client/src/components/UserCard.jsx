import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Text,
  HStack,
  VStack,
  Spinner,
  useToast,
  Flex,
} from '@chakra-ui/react';
import axios from 'axios';

export default function UserCard() {
  const [user, setUser] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    axios.get('/api/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
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
        bg="gray"
        p={4}
        borderRadius="25px"
        boxShadow="0 0 10px rgba(0,0,0,0.1)"
        width="300px"
        height="100px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner />
      </Box>
    );
  }

  const avatarSrc = user.avatarBase64
    ? `data:image/png;base64,${user.avatarBase64}`
    : undefined;

  return (
    <Box
      bg="gray"
      p={4}
      borderRadius="25px"
      boxShadow="0 0 10px rgba(0,0,0,0.1)"
      width="300px"
      height="22%"
      
    >
      <Flex align="flex-end" height="40%">
        <Avatar size="lg" name={user.name} src={avatarSrc} />

        <VStack align="start" spacing={0} ml={4} pb="2px">
          <Text fontWeight="bold" fontSize="md">
            {user.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            @{user.login}
          </Text>
        </VStack>
      </Flex>
    </Box>
  );
}