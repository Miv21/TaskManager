import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Textarea, Select, useToast
} from '@chakra-ui/react';
import axios from 'axios';


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
          headers: {  Authorization: `Bearer ${token}` }
        })
        .then(res => setUsers(res.data))
        .catch(err => {
          toast({
            title: 'Ошибка загрузки пользователей',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Description', description);
    formData.append('Deadline', deadline);
    formData.append('TargetUserId', targetUserId);
    if (file) {
      // Загружаем файл отдельно на сервер и получаем ссылку
      const fileForm = new FormData();
      fileForm.append('file', file);
      const uploadRes = await axios.post('/api/files/upload-files', fileForm);
      formData.append('FileUrl', uploadRes.data.fileUrl);
    }

    try {
      await axios.post('/api/taskcard/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' , Authorization: `Bearer ${token}` }
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
      <ModalContent>
        <ModalHeader>Создание задания</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Название</FormLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Описание</FormLabel>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Дедлайн</FormLabel>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Пользователь</FormLabel>
            <Select placeholder="Выберите пользователя" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Файл (опционально)</FormLabel>
            <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={handleSubmit}>Создать</Button>
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default TaskCreateModal;