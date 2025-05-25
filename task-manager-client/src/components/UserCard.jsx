import React, { useState, useEffect } from 'react';
import {
  Box, Avatar, Text, Flex,
  VStack, Spinner, useToast, Divider, HStack, IconButton
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
      <Box>
        <Spinner />
      </Box>
    );
  }

  const avatarSrc = user.avatarBase64 || undefined;

  return (
    <Box
      bg="polar.100"
      p={4}
      borderRadius="25px"
      boxShadow= "2px 6px 8px 1px rgba(0, 0, 0, 0.24)"
      width="300px"
      height="auto"
    >
      <Flex align="flex-end" mb="16px">
        <Avatar
          boxShadow= "2px 5px 5px 0px rgba(0, 0, 0, 0.45)"
          size="lg" 
          name={user.name} 
          src={avatarSrc} 
        />
        <VStack align="start" spacing={0} ml={4} pb="2px">
          <Text fontWeight="bold" fontSize="md">
            {user.name}
          </Text>
          <Text fontSize="sm" color="gray.600">
            @{user.login} , {user.positionName}
          </Text>
        </VStack>
      </Flex>

      <Divider/>

      <HStack spacing={4} justify="center" mt="16px">
        <IconButton
          aria-label="Настройки"
          icon={<SettingsIcon boxSize="17px" strokeWidth="2.5" color="currentColor" />}
          variant="ghost"
          boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.2)"
          size="md"
          color="polar.300"
          _hover={{ bg: "polar.200", color: "polar.100" }}
          _active={{ bg: "polar.300", color: "polar.100", boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0)" }}
          transition="background-color 0.3s, color 0.3s, box-shadow 0.3s"
          onClick={() => navigate('/settings')}
        />
        <IconButton
        
          aria-label="Сменить тему"
          icon={<SunIcon boxSize="22px" strokeWidth="2.5" color="currentColor" />}
          variant="ghost"
          boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.2)"
          size="md"
          color="polar.300"
          _hover={{ bg: "polar.200", color: "polar.100"  }}
          _active={{ bg: "polar.300", color: "polar.100", boxShadow: "0px 0px 0px 0px rgba(0, 0, 0, 0)" }}
          transition="background-color 0.3s, color 0.3s, box-shadow 0.3s"
          onClick={() => {
            // TODO: переключить тему
          }}
        />
      </HStack>
    </Box>
  );
}
