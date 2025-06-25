import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Textarea, Select, useToast, IconButton, Flex, FormErrorMessage
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { DateTime } from 'luxon';

const getErrorMessage = (error, defaultMessage = "Произошла неизвестная ошибка.") => {
  if (error.response && error.response.data) {
    const errorData = error.response.data;
    if (typeof errorData === 'string') {
      return errorData;
    }
    if (typeof errorData === 'object' && errorData !== null) {
      if (errorData.errors) {
        const messages = Object.values(errorData.errors)
          .flatMap(arr => Array.isArray(arr) ? arr : [arr])
          .filter(msg => typeof msg === 'string');
        return messages.length > 0 ? messages.join("; ") : defaultMessage;
      }
      if (errorData.title) return errorData.title;
      if (errorData.detail) return errorData.detail;
    }
  }
  return defaultMessage;
};


const TaskCreateModal = ({ isOpen, onClose, onTaskCreated }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const token = localStorage.getItem('token');

  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [deadlineError, setDeadlineError] = useState('');
  const [targetUserIdError, setTargetUserIdError] = useState('');


  const handleSubmit = useCallback(async () => {
    setTitleError('');
    setDescriptionError('');
    setDeadlineError('');
    setTargetUserIdError('');

    let isValid = true;

    if (!title) {
      setTitleError('Название обязательно для заполнения.');
      isValid = false;
    }
    if (!description) {
      setDescriptionError('Описание обязательно для заполнения.');
      isValid = false;
    }
    if (!deadline) {
      setDeadlineError('Дедлайн обязателен для заполнения.');
      isValid = false;
    }
    if (!targetUserId) {
      setTargetUserIdError('Пользователь обязателен для выбора.');
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Description', description);

    const localDeadline = DateTime.fromISO(deadline, { zone: 'Europe/Moscow' });
    const utcDeadline = localDeadline.toUTC().toISO();
    formData.append('Deadline', utcDeadline);
    formData.append('TargetUserId', targetUserId);

    let uploadedFileName = null;

    try {
      if (file) {
        const fileForm = new FormData();
        fileForm.append('file', file);

        const uploadRes = await axios.post('/api/files/upload-files', fileForm);
        formData.append('FileUrl', uploadRes.data.fileUrl);

        uploadedFileName = new URL(uploadRes.data.fileUrl).pathname.split('/').pop();
      }

      await axios.post('/api/taskcard/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Задание создано',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onTaskCreated();

    } catch (err) {
      if (uploadedFileName) {
        try {
          await axios.delete(`/api/files/delete-files/${uploadedFileName}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (deleteErr) {
          console.warn('Ошибка при удалении файла после неудачной попытки создания задания:', deleteErr);
        }
      }

      if (err.response && err.response.data && err.response.data.errors) {
        const serverErrors = err.response.data.errors;
        if (serverErrors.Title) setTitleError(serverErrors.Title.join('; '));
        if (serverErrors.Description) setDescriptionError(serverErrors.Description.join('; '));
        if (serverErrors.Deadline) setDeadlineError(serverErrors.Deadline.join('; '));
        if (serverErrors.TargetUserId) setTargetUserIdError(serverErrors.TargetUserId.join('; '));
      }

      toast({
        title: 'Ошибка при создании задания',
        description: getErrorMessage(err, 'Не удалось создать задание. Проверьте введенные данные.'),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [title, description, deadline, file, targetUserId, token, toast, onClose, onTaskCreated]);


  useEffect(() => {
    if (isOpen) {
      axios.get('/api/taskcard/available', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setUsers(res.data))
        .catch((err) => {
          toast({
            title: 'Ошибка загрузки пользователей',
            description: getErrorMessage(err, 'Не удалось загрузить список пользователей.'),
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [isOpen, toast, token]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setDeadline('');
      setFile(null);
      setTargetUserId('');
      setTitleError('');
      setDescriptionError('');
      setDeadlineError('');
      setTargetUserIdError('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && isOpen) {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleSubmit]);


  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="25" backgroundColor="polar.50">
        <ModalHeader>Создание задания</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4} isInvalid={!!titleError}>
            <FormLabel>Название</FormLabel>
            <Input borderColor="grey" value={title} onChange={(e) => setTitle(e.target.value)} />
            <FormErrorMessage>{titleError}</FormErrorMessage>
          </FormControl>
          <FormControl mb={4} isInvalid={!!descriptionError}>
            <FormLabel>Описание</FormLabel>
            <Textarea height="175px" borderColor="grey" value={description} onChange={(e) => setDescription(e.target.value)} />
            <FormErrorMessage>{descriptionError}</FormErrorMessage>
          </FormControl>
          <FormControl mb={4} isInvalid={!!deadlineError}>
            <FormLabel>Дедлайн</FormLabel>
            <Input borderColor="grey" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <FormErrorMessage>{deadlineError}</FormErrorMessage>
          </FormControl>
          <FormControl mb={4} isInvalid={!!targetUserIdError}>
            <FormLabel>Пользователь</FormLabel>
            <Select borderColor="grey" placeholder="Выберите пользователя" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </Select>
            <FormErrorMessage>{targetUserIdError}</FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Файл (необязателен)</FormLabel>
            <Flex align="center">
              <Input
                type="file"
                display="none"
                id="file-upload"
                onChange={(e) => setFile(e.target.files[0])}
              />
              <IconButton
                as="label"
                htmlFor="file-upload"
                icon={<AttachmentIcon />}
                variant="outline"
                borderColor="gray"
                aria-label="Загрузить файл"
              />
              {file && <span style={{ marginLeft: '10px' }}>{file.name}</span>}
            </Flex>
          </FormControl>
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button
            boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.4)"
            variant="modal"
            mr={3}
            onClick={handleSubmit}
          >
            Создать
          </Button>
          <Button
            boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.4)"
            onClick={onClose}
          >
            Отмена
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TaskCreateModal;