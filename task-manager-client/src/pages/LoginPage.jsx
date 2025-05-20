import React, { useState, useRef } from 'react';
import {
  Box, Button, Input, FormControl, FormLabel,
  FormErrorMessage,  Heading, useToast, InputGroup, InputRightElement, IconButton
} from '@chakra-ui/react';
import axios from 'axios';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/useAuth';

export default function LoginPage() {
  const [form, setForm] = useState({ login: '', password: '' });
  const [errors, setErrors] = useState({ login: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null); 
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();  // достаем функцию login из контекста

  const validate = () => {
    const errs = { login: '', password: '' };
    if (!form.login.trim()) {
      errs.login = 'Логин обязателен';
    } 
    const password = form.password;
    if (!password) {
      errs.password = 'Пароль обязателен';
    } 
    setErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const res = await axios.post('/api/auth/login', form);
      const { token } = res.data;
      // вызываем login из контекста, чтобы обновить состояние
      login(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      navigate('/tasks');
    } catch (err) {
      if (err.response?.status === 401) {
        setErrors({ ...errors, login, password: 'Неверный логин или пароль' });
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Box maxW="md" mx="auto" mt="20" p="8" boxShadow="md" borderRadius="md">
      <Heading size="lg" mb={6}>Вход</Heading>

      <FormControl mb={3} isRequired isInvalid={!!errors.login}>
        <FormLabel>Логин</FormLabel>
        <Input
          value={form.login}
          onChange={e => setForm({ ...form, login: e.target.value })}
          onKeyDown={handleKeyDown}
          focusBorderColor={errors.login ? 'red.500' : 'blue.500'}
          errorBorderColor="red.500"
          borderColor={errors.login ? 'red.500' : 'gray.200'}
        />
        <FormErrorMessage mt={1} color="red.500">{errors.login}</FormErrorMessage>
      </FormControl>

      <FormControl mb={3} isRequired isInvalid={!!errors.password}>
        <FormLabel>Пароль</FormLabel>
        <InputGroup>
          <Input
            ref={passwordRef}
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={handleKeyDown}
            focusBorderColor={errors.password ? 'red.500' : 'blue.500'}
            errorBorderColor="red.500"
            borderColor={errors.password ? 'red.500' : 'gray.200'}
          />
          <InputRightElement>
            <IconButton
              type="button" 
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowPassword(!showPassword);
                setTimeout(() => passwordRef.current?.focus(), 0); 
              }}
              icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
            />
          </InputRightElement>
        </InputGroup>
        <FormErrorMessage mt={1} color="red.500">{errors.password}</FormErrorMessage>
      </FormControl>

      <Button colorScheme="blue" w="full" onClick={handleSubmit}>
        Войти
      </Button>
    </Box>
  );
}