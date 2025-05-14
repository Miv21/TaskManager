import React, { useState, useEffect } from 'react';
import {
  Flex, Box, Avatar, Heading, Text, Button,
  FormControl, FormLabel, Input, FormErrorMessage,
  VStack, Spinner, useToast, Divider, Modal,
  ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter
} from '@chakra-ui/react';
import axios from 'axios';

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Модалки
  const [loginModal, setLoginModal] = useState(false);
  const [passModal, setPassModal]   = useState(false);

  // Шаг внутри модалки
  const [step, setStep] = useState(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [curErr, setCurErr] = useState('');

  // Для логина
  const [newLogin, setNewLogin] = useState('');
  const [loginErr, setLoginErr] = useState('');

  // Для пароля
  const [newPassword, setNewPassword] = useState('');
  const [passErr, setPassErr] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUser(r.data))
      .catch(() => toast({ status: 'error', description: 'Не удалось загрузить профиль' }))
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) return <Spinner size="xl" />;

  const openModal = (type) => {
    setStep(1);
    setCurrentPassword('');
    setCurErr('');
    if (type === 'login') {
      setNewLogin(''); setLoginErr('');
      setLoginModal(true);
    } else {
      setNewPassword(''); setPassErr('');
      setPassModal(true);
    }
  };

  const checkCurrent = () => {
    if (!currentPassword) {
      setCurErr('Введите текущий пароль');
      return;
    }
    setCurErr('');
    setStep(2);
  };

  const submitLogin = async () => {
    if (!/^[A-Za-z0-9_]+$/.test(newLogin)) {
      setLoginErr('Только буквы, цифры и подчёркивание');
      return;
    }
    try {
      await axios.put(
        `/api/users/${user.id}/login`,
        { currentPassword, newLogin },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast({ status: 'success', description: 'Логин обновлён' });
      setUser(u => ({ ...u, login: newLogin }));
      setLoginModal(false);
    } catch (e) {
      toast({ status: 'error', description: e.response?.data || 'Ошибка' });
    }
  };

  const submitPassword = async () => {
    if (newPassword.length < 8) {
      setPassErr('Минимум 8 символов');
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPassErr('Нужна заглавная буква');
      return;
    }
    try {
      await axios.put(
        `/api/users/${user.id}/password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast({ status: 'success', description: 'Пароль обновлён' });
      setPassModal(false);
    } catch (e) {
      toast({ status: 'error', description: e.response?.data || 'Ошибка' });
    }
  };

  return (
    
    <Flex p={6} gap={8}>
      {/* Профиль */}
        <VStack align="start" spacing={4} width="300px">
          <Avatar size="xl" name={user.name} src={user.avatarBase64 && `data:image/png;base64,${user.avatarBase64}`} />
          <Heading size="md">{user.name}</Heading>
          <Text><b>Логин:</b> {user.login}</Text>
          <Text><b>Email:</b> {user.email}</Text>
          <Text><b>Отдел:</b> {user.departmentName || '—'}</Text>
        </VStack>

        <Divider orientation="vertical" />

      {/* Кнопки */}
        <Flex direction="column" gap={4}>
            <Flex align="center" gap={4}>
                <Text whiteSpace="nowrap">Для смены логина:</Text>
                <Button onClick={() => openModal('login')}>Сюда</Button>
            </Flex>
            <Divider orientation="horizontal" />
            <Flex align="center" gap={4}>
                <Text whiteSpace="nowrap">Для смены пароля нажмите:</Text>
                <Button onClick={() => openModal('password')}>Сюда</Button>
            </Flex>
        </Flex>

      {/* Модалка смены логина */}
      <Modal isOpen={loginModal} onClose={() => setLoginModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сменить логин</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {step === 1
              ? <FormControl isInvalid={!!curErr}>
                  <FormLabel>Текущий пароль</FormLabel>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                  <FormErrorMessage>{curErr}</FormErrorMessage>
                  <Button mt={4} onClick={checkCurrent}>Далее</Button>
                </FormControl>
              : <FormControl isInvalid={!!loginErr}>
                  <FormLabel>Новый логин</FormLabel>
                  <Input
                    value={newLogin}
                    onChange={e => setNewLogin(e.target.value)}
                  />
                  <FormErrorMessage>{loginErr}</FormErrorMessage>
                  <Button mt={4} onClick={submitLogin}>Сохранить</Button>
                </FormControl>
            }
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Модалка смены пароля */}
      <Modal isOpen={passModal} onClose={() => setPassModal(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сменить пароль</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {step === 1
              ? <FormControl isInvalid={!!curErr}>
                  <FormLabel>Текущий пароль</FormLabel>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                  <FormErrorMessage>{curErr}</FormErrorMessage>
                  <Button mt={4} onClick={checkCurrent}>Далее</Button>
                </FormControl>
              : <FormControl isInvalid={!!passErr}>
                  <FormLabel>Новый пароль</FormLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <FormErrorMessage>{passErr}</FormErrorMessage>
                  <Button mt={4} onClick={submitPassword}>Сохранить</Button>
                </FormControl>
            }
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}