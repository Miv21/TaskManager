import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Text,
  Flex,
  VStack,
  Spinner,
  useToast,
  Divider,
  HStack,
  Button,
  IconButton
} from '@chakra-ui/react';
import axios from 'axios';
import { SunIcon, SettingsIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

export default function UserCard() {
  const [user, setUser] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    axios.get('/api/me', {
      headers: { Authorization: `Bearer ${token}` }
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
        bg="gray.100"
        p={4}
        borderRadius="25px"
        boxShadow="0 0 10px rgba(0,0,0,0.1)"
        width="280px"
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
      height="auto"
    >
      <Flex align="flex-end" mb={2}>
        <Avatar size="lg" name={user.name} src={avatarSrc} />
        <VStack align="start" spacing={0} ml={4} pb="2px">
          <Text fontWeight="bold" fontSize="md">
            {user.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            @{user.login} , {user.positionName}
          </Text>
        </VStack>
      </Flex>

      <Divider mb={2} />

      <HStack spacing={4} justify="center" mt="10px">
        <IconButton
          aria-label="Настройки"
          icon={<SettingsIcon />}
          variant="ghost"
          size="md"
          bg="gray"
          _hover={{ bg: "gray.600", color: "white" }}
          _active={{ bg: "gray.700", color: "whiteAlpha.900" }}
          transition="background-color 0.2s, color 0.2s"
          onClick={() => navigate('/settings')}
        />
        <IconButton
        
          aria-label="Сменить тему"
          icon={<SunIcon boxSize="20px" strokeWidth="2.5" color="currentColor" />}
          variant="ghost"
          size="md"
          bg="gray"
          _hover={{ bg: "gray.600", color: "white" }}
          _active={{ bg: "gray.700", color: "whiteAlpha.900" }}
          transition="background-color 0.2s, color 0.2s"
          onClick={() => {
            // TODO: переключить тему
          }}
        />
      </HStack>
    </Box>
  );
}
