import React, { useState } from 'react';
import {
  Box, Button, Input, FormControl, FormLabel,
  FormErrorMessage, VStack, Heading, useToast
} from '@chakra-ui/react';
import axios from 'axios';

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ login: '', password: '' });
  const [errors, setErrors] = useState({ login: '', password: '' });
  const toast = useToast();

  const validate = () => {
    const errs = { login: '', password: '' };
    if (!form.login.trim()) errs.login = 'Логин обязателен';
    if (!form.password) errs.password = 'Пароль обязателен';
    setErrors(errs);
    return !errs.login && !errs.password;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      const res = await axios.post('/api/auth/login', form);
      const { token, id, name, login, email, role } = res.data;
      // сохраняем токен, например в localStorage
      localStorage.setItem('token', token);
      onLogin({ id, name, login, email, role });
    } catch (err) {
      toast({ status: 'error', description: 'Неверный логин или пароль' });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt="20" p="8" boxShadow="md" borderRadius="md">
      <VStack spacing="6">
        <Heading size="lg">Вход</Heading>
        <FormControl isInvalid={!!errors.login}>
          <FormLabel>Логин</FormLabel>
          <Input
            value={form.login}
            onChange={e => setForm({ ...form, login: e.target.value })}
          />
          <FormErrorMessage>{errors.login}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.password}>
          <FormLabel>Пароль</FormLabel>
          <Input
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <FormErrorMessage>{errors.password}</FormErrorMessage>
        </FormControl>
        <Button colorScheme="blue" w="full" onClick={handleSubmit}>
          Войти
        </Button>
      </VStack>
    </Box>
  );
}