import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Textarea, Select, useToast, IconButton, Flex
} from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { DateTime } from 'luxon';

const TaskEditModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState(''); // Это должно быть строкой, чтобы соответствовать значениям option
  const [originalFileUrl, setOriginalFileUrl] = useState('');
  const token = localStorage.getItem('token');

  console.log('TaskEditModal rendered. Current isOpen:', isOpen, 'Current task:', task);

  useEffect(() => {
    console.log('useEffect (isOpen, task) triggered.');

    if (isOpen && task) {
      console.log("  Inside useEffect: task object received:", task);

      const newTitle = task.Title || ''; 
      const newDescription = task.Description || ''; 
      
      const newDeadline = task.Deadline
        ? DateTime.fromISO(task.Deadline).isValid 
          ? DateTime.fromISO(task.Deadline).toFormat("yyyy-MM-dd'T'HH:mm")
          : ''
        : '';
      
      // Корректный регистр для targetUserId из API
      const newTargetUserId = task.targetUserId ? String(task.targetUserId) : ''; 
      const newOriginalFileUrl = task.FileUrl || ''; 

      console.log("  Setting states with these values:");
      console.log("    newTitle:", newTitle);
      console.log("    newDescription:", newDescription);
      console.log("    newDeadline:", newDeadline);
      console.log("    newTargetUserId (from task):", newTargetUserId); // Запишем это значение
      console.log("    newOriginalFileUrl:", newOriginalFileUrl);

      setTitle(newTitle);
      setDescription(newDescription);
      setDeadline(newDeadline);
      setTargetUserId(newTargetUserId); // Устанавливаем состояние
      setOriginalFileUrl(newOriginalFileUrl);

    } else if (!isOpen) {
      console.log('  Modal closing or task is null, resetting all states.');
      setTitle('');
      setDescription('');
      setDeadline(''); 
      setTargetUserId('');
      setFile(null);
      setOriginalFileUrl('');
    }
  }, [isOpen, task]);

  useEffect(() => {
      console.log('States *actually* updated in DOM after render:');
      console.log('  title (state):', title);
      console.log('  description (state):', description);
      console.log('  deadline (state):', deadline);
      console.log('  targetUserId (state):', targetUserId); // ВАЖНО: Проверьте этот лог после выполнения всех эффектов
      console.log('  originalFileUrl (state):', originalFileUrl);
      console.log('  file (newly selected, state):', file); 
  }, [title, description, deadline, targetUserId, originalFileUrl, file]);


  useEffect(() => {
    if (isOpen) {
      console.log('Fetching available users...'); 
      axios.get('/api/taskcard/available', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          console.log('Available users fetched:', res.data); // ВАЖНО: Проверьте этот лог на предмет ID пользователей и их типов
          setUsers(res.data);
        })
        .catch((error) => {
          console.error("Error loading users:", error); 
          toast({
            title: 'Ошибка загрузки пользователей',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [isOpen, token, toast]);

  // Добавьте этот useEffect для явного логирования значения select в DOM
  useEffect(() => {
      if (isOpen) {
          const selectElement = document.querySelector('select[name="targetUserId"]');
          if (selectElement) {
              console.log('DOM Select Element Value:', selectElement.value);
              console.log('State targetUserId:', targetUserId);
              // Также проверьте, соответствует ли текущий targetUserId любому пользователю в массиве 'users'
              const foundUser = users.find(user => String(user.id) === targetUserId);
              console.log('User found in "users" array for targetUserId:', foundUser);
          }
      }
  }, [isOpen, targetUserId, users]); // Этот эффект зависит от этих состояний

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
    }
  }, [isOpen]);

  const getFileNameFromUrl = (url) => {
    try {
      return url ? decodeURIComponent(new URL(url).pathname.split('/').pop()) : null;
    } catch (e) {
      console.error("Error parsing file URL:", e);
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!task || typeof task.Id === 'undefined' || task.Id === null) { 
      toast({
        title: 'Ошибка',
        description: 'Не удалось определить ID задания для обновления.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('Id', task.Id); 
    formData.append('Title', title);
    formData.append('Description', description);

    if (deadline) {
        const localDeadline = DateTime.fromISO(deadline); 
        const utcDeadline = localDeadline.toUTC().toISO(); 
        formData.append('Deadline', utcDeadline);
    } else {
        formData.append('Deadline', ''); 
    }

    if (task.Type === "CreatedTasks" || task.Type === "MyTasks") { 
        const userIdAsNumber = parseInt(targetUserId, 10);
        if (isNaN(userIdAsNumber) || userIdAsNumber <= 0) { 
            toast({
                title: 'Ошибка валидации',
                description: 'Пожалуйста, укажите действительного пользователя для назначения.', 
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }
        formData.append('TargetUserId', userIdAsNumber);
    }

    let newFileUrl = '';
    let originalFileWasDeleted = false;

    try {
      if (file) {
        const fileForm = new FormData();
        fileForm.append('file', file);
        const uploadRes = await axios.post('/api/files/upload-files', fileForm);
        newFileUrl = uploadRes.data.fileUrl;
        formData.append('FileUrl', newFileUrl);
      } else {
        formData.append('FileUrl', originalFileUrl || '');
      }

      await axios.put('/api/taskcard/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

      if (file && originalFileUrl) {
        const fileName = getFileNameFromUrl(originalFileUrl);
        if (fileName) {
          await axios.delete(`/api/files/delete-files/${fileName}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          originalFileWasDeleted = true;
        }
      }

      toast({
        title: 'Задание обновлено',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      onTaskUpdated();

    } catch (err) {
      console.error('Ошибка при обновлении задания:', err);

      if (newFileUrl) {
        const newFileName = getFileNameFromUrl(newFileUrl);
        if (newFileName) {
          try {
            await axios.delete(`/api/files/delete-files/${newFileName}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Загруженный новый файл успешно удален из-за ошибки обновления задачи.');
          } catch (deleteNewFileErr) {
            console.error('Ошибка при удалении нового загруженного файла:', deleteNewFileErr);
          }
        }
      }

      if (originalFileUrl && originalFileWasDeleted) {
        try {
          const originalFile = await fetch(originalFileUrl).then(res => res.blob());
          const filename = getFileNameFromUrl(originalFileUrl);
          const fileToReupload = new File([originalFile], filename, { type: originalFile.type });

          const reuploadForm = new FormData();
          reuploadForm.append('file', fileToReupload);

          await axios.post('/api/files/upload-files', reuploadForm, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Оригинальный файл успешно восстановлен после ошибки обновления задачи.');
        } catch (restoreErr) {
          console.error('Ошибка восстановления оригинального файла:', restoreErr);
        }
      }

      toast({
        title: 'Ошибка при обновлении задания',
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
        <ModalHeader>Редактирование задания</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormControl mb={4}>
            <FormLabel>Название</FormLabel>
            <Input borderColor="grey" value={title} onChange={(e) => setTitle(e.target.value)} />
          </FormControl>
          <FormControl mb={4}>
            <FormLabel>Описание</FormLabel>
            <Textarea height="249px"  borderColor="grey" value={description} onChange={(e) => setDescription(e.target.value)} />
          </FormControl>
          
          <FormControl mb={4}>
            <FormLabel>Дедлайн</FormLabel>
            <Input
              borderColor="grey"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </FormControl>
          
          { (task && (task.Type === "CreatedTasks" || task.Type === "MyTasks")) && (
              <FormControl mb={4}>
                <FormLabel>Пользователь</FormLabel>
                <Select 
                  borderColor="grey" 
                  value={targetUserId} // Это состояние управляет выбранной опцией
                  onChange={(e) => setTargetUserId(e.target.value)}
                  name="targetUserId" 
                >
                  <option value="">Выберите пользователя</option> 
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </Select>
              </FormControl>
          )}

          <FormControl mb={4}> 
            <FormLabel htmlFor="file-edit">Заменить файл (необязательно)</FormLabel>
            <Flex align="center">
              <Input
                type="file"
                display="none"
                id="file-edit" 
                onChange={(e) => setFile(e.target.files[0])}
              />
              <IconButton
                as="label" 
                htmlFor="file-edit" 
                icon={<AttachmentIcon />}
                variant="outline"
                borderColor="gray"
                aria-label="Загрузить файл"
              />
              {file && <span style={{ marginLeft: '10px' }}>{file.name}</span>}
              {!file && originalFileUrl && (
                <span style={{ marginLeft: '10px' }}>
                    Текущий файл: <a href={originalFileUrl} target="_blank" rel="noopener noreferrer">{getFileNameFromUrl(originalFileUrl)}</a>
                </span>
              )}
            </Flex>
          </FormControl>
          
        </ModalBody>
        <ModalFooter justifyContent="center">
          <Button
            boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.4)"
            variant="modal"
            mr={3}
            onClick={handleUpdate}
          >
            Сохранить
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

export default TaskEditModal;