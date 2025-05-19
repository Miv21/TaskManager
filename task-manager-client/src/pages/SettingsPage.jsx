import React, { useState, useEffect, useRef } from 'react';
import {
  Flex, Avatar, Heading, Text, Button, FormControl,
  FormLabel, Input, InputGroup, InputRightElement,
  FormErrorMessage, VStack, Spinner, useToast, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody

} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import axios from 'axios';

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [loginModal, setLoginModal] = useState(false);
  const [passModal, setPassModal] = useState(false);
  const [step, setStep] = useState(1);

  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [curErr, setCurErr] = useState("");

  const [newLogin, setNewLogin] = useState("");
  const [loginErr, setLoginErr] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [passErr, setPassErr] = useState("");

  const currentRef = useRef();
  const loginRef = useRef();
  const passwordRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setUser(r.data))
      .catch(() => toast({ status: "error", description: "Не удалось загрузить профиль" }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    if (step === 2) {
      if (loginModal && loginRef.current) loginRef.current.focus();
      if (passModal && passwordRef.current) passwordRef.current.focus();
    } else if (loginModal || passModal) {
      if (currentRef.current) currentRef.current.focus();
    }
  }, [step, loginModal, passModal]);

  if (loading) return <Spinner size="xl" />;

  const openModal = (type) => {
    setShowCurrent(false);
    setShowNew(false);
    setStep(1);
    setCurrentPassword("");
    setCurErr("");

    if (type === "login") {
      setNewLogin("");
      setLoginErr("");
      setLoginModal(true);
    } else {
      setNewPassword("");
      setPassErr("");
      setPassModal(true);
    }
  };

  const closeLoginModal = () => {
    setLoginModal(false);
    setStep(1);
  };

  const closePassModal = () => {
    setPassModal(false);
    setStep(1);
  };

  const handleKeyDown = (e, action) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    action();
  };

  const handleButtonKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const checkCurrent = async () => {
    if (!currentPassword) {
      setCurErr("Введите текущий пароль");
      return;
    }
    try {
      await axios.post(
        `/api/users/${user.id}/validate-password`,
        { currentPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setCurErr("");
      setStep(2);
    } catch (e) {
      setCurErr(e.response?.data || "Неверный текущий пароль");
    }
  };

  const submitLogin = async () => {
    if (!/^[A-Za-z0-9_]+$/.test(newLogin)) {
      setLoginErr("Только буквы, цифры и подчёркивание");
      return;
    }
    try {
      await axios.put(
        `/api/users/${user.id}/login`,
        { currentPassword, newLogin },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setUser(u => ({ ...u, login: newLogin }));
      toast({ status: "success", description: "Логин обновлён" });
      closeLoginModal();
    } catch (e) {
      setLoginErr(e.response?.data || "Ошибка");
    }
  };

  const submitPassword = async () => {
    if (newPassword.length < 8) {
      setPassErr("Минимум 8 символов");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPassErr("Нужна заглавная буква");
      return;
    }
    try {
      await axios.put(
        `/api/users/${user.id}/password`,
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast({ status: "success", description: "Пароль обновлён" });
      closePassModal();
    } catch (e) {
      setPassErr(e.response?.data || "Ошибка");
    }
  };

  return (
    <Flex p={6} gap={8}>
      <VStack align="start" spacing={4} width="300px" >
        <Flex align="center" gap={6}>
          <Avatar
            size="xl"
            name={user.name}
            src={user.avatarBase64 ? `data:image/png;base64,${user.avatarBase64}` : undefined}
          />
          <Button size="sm" onClick={() => toast({ description: "Редактирование аватара пока не реализовано", status: "info" })}>
            Редактировать аватарку
          </Button>
        </Flex>
        <Heading size="md">{user.name}</Heading>
        <Text><b>Логин:</b> @{user.login}</Text>
        <Text><b>Email:</b> {user.email}</Text>
        <Text><b>Отдел:</b> {user.departmentName || "Не причислен к отделу"}</Text>
        <Text><b>Должность:</b> {user.positionName}</Text>
      </VStack>

      <Divider orientation="vertical" />

      <VStack align="stretch" spacing={4} >
        <Flex align="center" justify="space-between">
          <Text whiteSpace="nowrap" mr={4}>Сменить логин:</Text>
          <Button onClick={() => openModal("login")} onKeyDown={handleButtonKeyDown}>
            Начать
          </Button>
        </Flex>
        <Divider />
        <Flex align="center" justify="space-between">
          <Text whiteSpace="nowrap" mr={4}>Сменить пароль:</Text>
          <Button onClick={() => openModal("password")} onKeyDown={handleButtonKeyDown}>
            Начать
          </Button>
        </Flex>
      </VStack>

      {/* Модалка логина */}
      <Modal 
        isOpen={loginModal} 
        onClose={closeLoginModal} 
        isCentered
        initialFocusRef={step === 1 ? currentRef : loginRef}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сменить логин</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {step === 1 ? (
              <FormControl isInvalid={!!curErr}>
                <FormLabel>Текущий пароль</FormLabel>
                <InputGroup>
                  <Input
                    ref={currentRef}
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, checkCurrent)}
                    focusBorderColor={curErr ? "red.500" : "blue.500"}
                    errorBorderColor="red.500"
                  />
                  <InputRightElement>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{curErr}</FormErrorMessage>
                <Button mt={4} onClick={checkCurrent}>Далее</Button>
              </FormControl>
            ) : (
              <FormControl isInvalid={!!loginErr}>
                <FormLabel>Новый логин</FormLabel>
                <Input
                  ref={loginRef}
                  value={newLogin}
                  onChange={e => setNewLogin(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, submitLogin)}
                  focusBorderColor={curErr ? "red.500" : "blue.500"}
                  errorBorderColor="red.500"
                />
                <FormErrorMessage>{loginErr}</FormErrorMessage>
                <Button mt={4} onClick={submitLogin}>Сохранить</Button>
              </FormControl>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Модалка пароля */}
      <Modal 
        isOpen={passModal} 
        onClose={closePassModal} 
        isCentered
        initialFocusRef={step === 1 ? currentRef : passwordRef}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Сменить пароль</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {step === 1 ? (
              <FormControl isInvalid={!!curErr}>
                <FormLabel>Текущий пароль</FormLabel>
                <InputGroup>
                  <Input
                    ref={currentRef}
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, checkCurrent)}
                    focusBorderColor={curErr ? "red.500" : "blue.500"}
                    errorBorderColor="red.500"
                  />
                  <InputRightElement>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      {showCurrent ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{curErr}</FormErrorMessage>
                <Button mt={4} onClick={checkCurrent}>Далее</Button>
              </FormControl>
            ) : (
              <FormControl isInvalid={!!passErr}>
                <FormLabel>Новый пароль</FormLabel>
                <InputGroup>
                  <Input
                    ref={passwordRef}
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, submitPassword)}
                    focusBorderColor={curErr ? "red.500" : "blue.500"}
                    errorBorderColor="red.500"
                  />
                  <InputRightElement>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onMouseDown={e => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={() => setShowNew(!showNew)}
                    >
                      {showNew ? <ViewOffIcon /> : <ViewIcon />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{passErr}</FormErrorMessage>
                <Button mt={4} onClick={submitPassword}>Сохранить</Button>
              </FormControl>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}


