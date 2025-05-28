import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Avatar, Text, Flex,
  VStack, Spinner, Divider, HStack, IconButton
} from '@chakra-ui/react';
import axios from 'axios';
import { SunIcon, SettingsIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';

export default function UserCard() {
  const [user, setUser] = useState(null);
  const [loadingError, setLoadingError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const timeoutRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Таймер для отслеживания таймаута
    timeoutRef.current = setTimeout(() => {
      setLoadingError(true);
      setIsLoading(false);
    }, 20000);

    axios.get('/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      clearTimeout(timeoutRef.current);
      setUser(res.data);
      setIsLoading(false);
    })
    .catch(() => {
      clearTimeout(timeoutRef.current);
      setLoadingError(true);
      setIsLoading(false);
    });

    return () => clearTimeout(timeoutRef.current);
  }, []);

  const getDisplayText = (field) => {
    if (isLoading) return <Spinner size="sm" />;
    if (loadingError) return 'Не удалось загрузить';
    return user?.[field] || 'Не доступно';
  };

  return (
    <Box
      bg="polar.100"
      p={4}
      borderRadius="25px"
      boxShadow="2px 6px 8px 1px rgba(0, 0, 0, 0.24)"
      width="300px"
      height="auto"
    >
      <Flex align="flex-end" mb="16px">
        <Avatar
          boxShadow="2px 5px 5px 0px rgba(0, 0, 0, 0.45)"
          size="lg"
          name={loadingError ? 'Ошибка' : user?.name}
          src={user?.avatarBase64}
          bg={loadingError ? 'red.100' : undefined}
        />
        
        <VStack align="start" spacing={0} ml={4} pb="2px">
          <Text fontWeight="bold" fontSize="md">
            {getDisplayText('name')}
          </Text>
          <Text fontSize="sm" color="gray.600">
            @{getDisplayText('login')}, {getDisplayText('positionName')}
          </Text>
        </VStack>
      </Flex>

      <Divider />

      <HStack spacing={4} justify="center" mt="16px">
        <IconButton
          aria-label="Настройки"
          icon={<SettingsIcon boxSize="17px" strokeWidth="2.5" />}
          variant="ghost"
          boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.2)"
          size="md"
          color="polar.300"
          _hover={{ bg: "polar.200", color: "polar.100" }}
          _active={{ bg: "polar.300", color: "polar.100", boxShadow: "none" }}
          onClick={() => navigate('/settings')}
        />
        <IconButton
          aria-label="Сменить тему"
          icon={<SunIcon boxSize="22px" strokeWidth="2.5" />}
          variant="ghost"
          boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.2)"
          size="md"
          color="polar.300"
          _hover={{ bg: "polar.200", color: "polar.100" }}
          _active={{ bg: "polar.300", color: "polar.100", boxShadow: "none" }}
        />
      </HStack>
    </Box>
  );
}
