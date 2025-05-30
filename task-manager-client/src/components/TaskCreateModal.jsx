import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Textarea, Select, useToast, IconButton, Flex
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { DateTime } from 'luxon';

const TaskCreateModal = ({ isOpen, onClose, onTaskCreated }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/taskcard/available', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setUsers(res.data))
        .catch(() => {
          toast({
            title: 'Ошибка загрузки пользователей',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setDeadline('');
      setFile(null);
      setTargetUserId('');
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
  }, [isOpen, title, description, deadline, file, targetUserId]);

  const handleSubmit = async () => {
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
        headers: { 'Content-Type': 'multipart/form-data' }
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
          await axios.delete(`/api/files/delete-files/${uploadedFileName}`);
        } catch (deleteErr) {
          console.warn('Ошибка при удалении файла после ошибки задания:', deleteErr);
        }
      }

      toast({
        title: 'Ошибка при создании задания',
        description: err.response?.data || 'Что-то пошло не так.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="25" backgroundColor="polar.50">
        <ModalHeader>Создание задания</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Название</FormLabel>
            <Input borderColor="grey" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Описание</FormLabel>
            <Textarea borderColor="grey" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Дедлайн</FormLabel>
            <Input borderColor="grey" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Пользователь</FormLabel>
            <Select borderColor="grey" placeholder="Выберите пользователя" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </Select>
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