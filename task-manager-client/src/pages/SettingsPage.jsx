import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flex, Avatar, Heading, Text, Button, FormControl,
  FormLabel, Input, InputGroup, InputRightElement,
  FormErrorMessage, VStack, Spinner, useToast, Divider,
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, Box
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import axios from 'axios';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { useAuth } from '../utils/useAuth'; // Импорт useAuth

export default function SettingsPage() {
  const toast = useToast();
  // Используем user и logout из useAuth
  const { user, logout } = useAuth(); 
  const [localUser, setLocalUser] = useState(null); // Используем localUser для отображения данных
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState(false);

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

  const [imageSrc, setImageSrc] = useState(null);
  const [avatarModal, setAvatarModal] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);


  useEffect(() => {
    if (step === 2) {
      if (loginModal && loginRef.current) loginRef.current.focus();
      if (passModal && passwordRef.current) passwordRef.current.focus();
    } else if (loginModal || passModal) {
      if (currentRef.current) currentRef.current.focus();
    }
  }, [step, loginModal, passModal]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setLocalUser(r.data)) // Обновляем localUser
      .catch(() => {
        setLoadingError(true);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  // Используем localUser для отображения в случае загрузки
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
        `/api/users/${localUser.id}/validate-password`, // Используем localUser.id
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
    if (newLogin === localUser.login) { // Используем localUser.login
      setLoginErr("Новый логин не должен совпадать с текущим");
      return;
    }
    try {
      await axios.put(
        `/api/users/${localUser.id}/login`, // Используем localUser.id
        { currentPassword, newLogin },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setLocalUser(u => ({ ...u, login: newLogin })); // Обновляем localUser
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
    if (newPassword === currentPassword) { // Здесь сравниваем новый пароль с введенным текущим, а не с хэшем из БД. Логика валидации должна быть на сервере.
      setPassErr("Новый пароль не должен совпадать с текущим"); // Это сообщение будет выдано, если новый пароль совпадает с только что введенным текущим. Сервер должен проверить, совпадает ли новый пароль с тем, что хранится в БД.
      return;
    }
    try {
      await axios.put(
        `/api/users/${localUser.id}/password`, // Используем localUser.id
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast({ status: "success", description: "Пароль обновлён" });
      closePassModal();
    } catch (e) {
      setPassErr(e.response?.data || "Ошибка");
    }
  };

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result.toString());
        setAvatarModal(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const saveCroppedImage = async () => {
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      await axios.put(
        `/api/users/${localUser.id}/avatar`, // Используем localUser.id
        { Base64: croppedImage },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setLocalUser(u => ({ ...u, avatarBase64: croppedImage.split(',')[1] })); // Обновляем localUser
      toast({ status: "success", description: "Аватар обновлён" });
      setAvatarModal(false);
      
      // Возможно, здесь стоит обновить аватар в контексте useAuth,
      // если он там тоже хранится или просто вызвать fetch user data.
      // Если аватара нет в контексте useAuth, можно и не обновлять.
      window.location.reload(); // Перезагрузка страницы для обновления аватара в меню
    } catch (e) {
      toast({ status: "error", description: "Ошибка при обновлении аватара" });
    }
  };

  const handleLogout = () => {
    logout(); // Вызываем функцию logout из AuthContext
    window.location.href = '/login'; // Перенаправляем на страницу входа
  };

  return (
    <Flex p={6} gap={8}>
      <VStack align="start" spacing={4} width="300px" >
        {loadingError ? (
          <Text color="red.500" fontSize="lg" mt={4}>
            Ошибка загрузки данных
          </Text>
        ) : (
          <>
          <Flex align="center" gap={6}>
            <Avatar
              size="xl"
              name={localUser?.name} // Используем localUser
              src={localUser?.avatarBase64 || undefined} // Используем localUser
            />
            <Button as="label" size="sm" cursor="pointer" borderRadius="25" height="45px" boxShadow= "0px 6px 5px 0px rgba(0, 0, 0, 0.40)" isDisabled={loadingError}>
              Редактировать аватарку
              <input type="file" hidden accept="image/*" onChange={onSelectFile} />
            </Button>
          </Flex>
          <Heading size="md">{localUser?.name}</Heading> {/* Используем localUser */}
          <Text><b>Логин:</b> @{localUser?.login}</Text> {/* Используем localUser */}
          <Text><b>Email:</b> {localUser?.email}</Text> {/* Используем localUser */}
          <Text><b>Отдел:</b> {localUser?.departmentName || "Не причислен к отделу"}</Text> {/* Используем localUser */}
          <Text><b>Должность:</b> {localUser?.positionName}</Text> {/* Используем localUser */}
          </>
        )}
      </VStack>

      <Divider orientation="vertical" />

      <VStack align="stretch" spacing={4} >
        <Flex align="center" justify="space-between">
          <Text whiteSpace="nowrap" mr={4}>Сменить логин:</Text>
          <Button borderRadius="25" boxShadow= "0px 6px 5px 0px rgba(0, 0, 0, 0.40)" onClick={() => openModal("login")} onKeyDown={handleButtonKeyDown} isDisabled={ loadingError}>
            Начать
          </Button>
        </Flex>
        <Divider />
        <Flex align="center" justify="space-between">
          <Text whiteSpace="nowrap" mr={4}>Сменить пароль:</Text>
          <Button borderRadius="25" boxShadow= "0px 6px 5px 0px rgba(0, 0, 0, 0.40)" onClick={() => openModal("password")} onKeyDown={handleButtonKeyDown} isDisabled={ loadingError}>
            Начать
          </Button>
        </Flex>
        <Divider />
        <Flex align="center" justify="space-between">
          <Text whiteSpace="nowrap" mr={4}>Выйти из аккаунта:</Text>
          <Button 
            borderRadius="25" 
            boxShadow="0px 6px 5px 0px rgba(0, 0, 0, 0.40)" 
            onClick={handleLogout} 
            isDisabled={loadingError}
            variant="red"
          >
            Выйти
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
        <ModalContent borderRadius="25" backgroundColor="polar.50">
          <ModalHeader>Сменить логин</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {step === 1 ? (
              <FormControl isInvalid={!!curErr}>
                <FormLabel>Текущий пароль</FormLabel>
                <InputGroup>
                  <Input
                    borderColor="grey"
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
                <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" mt={4} onClick={checkCurrent}>Далее</Button>
              </FormControl>
            ) : (
              <FormControl isInvalid={!!loginErr}>
                <FormLabel>Новый логин</FormLabel>
                <Input 
                  borderColor="grey"
                  ref={loginRef}
                  value={newLogin}
                  onChange={e => setNewLogin(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, submitLogin)}
                  focusBorderColor={loginErr ? "red.500" : "blue.500"}
                  errorBorderColor="red.500"
                />
                <FormErrorMessage>{loginErr}</FormErrorMessage>
                <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" mt={4} onClick={submitLogin}>Сохранить</Button>
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
        <ModalContent borderRadius="25" backgroundColor="polar.50">
          <ModalHeader>Сменить пароль</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {step === 1 ? (
              <FormControl isInvalid={!!curErr}>
                <FormLabel>Текущий пароль</FormLabel>
                <InputGroup>
                  <Input
                    borderColor="grey"
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
                <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" mt={4} onClick={checkCurrent}>Далее</Button>
              </FormControl>
            ) : (
              <FormControl isInvalid={!!passErr}>
                <FormLabel>Новый пароль</FormLabel>
                <InputGroup>
                  <Input
                    borderColor="grey"
                    ref={passwordRef}
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, submitPassword)}
                    focusBorderColor={passErr ? "red.500" : "blue.500"} // Исправлено на passErr
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
                <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" mt={4}  onClick={submitPassword}>Сохранить</Button>
              </FormControl>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Модалка добавления аватарки */}
      <Modal isOpen={avatarModal} onClose={() => setAvatarModal(false)} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="25" backgroundColor="polar.50">
          <ModalHeader>Редактировать аватар</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Box position="relative" width="100%" height="400px">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </Box>
            <Flex mt={4} justify="flex-end" gap={2}>
              <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.5)" onClick={() => setAvatarModal(false)}>Отмена</Button>
              <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.5)" onClick={saveCroppedImage}>Сохранить</Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}

