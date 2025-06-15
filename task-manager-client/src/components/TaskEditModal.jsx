import React, { useState, useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, FormControl, FormLabel,
  Input, Textarea, Select, useToast, IconButton, Flex, Text
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
  const [targetUserId, setTargetUserId] = useState('');
  const [currentFileUrl, setCurrentFileUrl] = useState(''); 
  const token = localStorage.getItem('token');


  useEffect(() => {


    if (isOpen && task) {
      if (task.Type === "MyResponses" || task.Type === "ResponsesToMyTasks") {
          console.error("TaskEditModal: Received an 'Answer' type object. This modal is for 'Tasks' only.", task);
          toast({
            title: "Ошибка",
            description: "Эта форма предназначена только для редактирования заданий.",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          onClose(); 
          return;
      }

      const newTitle = task.Title || '';
      const newDescription = task.Description || '';

      const newDeadline = task.Deadline
        ? DateTime.fromISO(task.Deadline).isValid
          ? DateTime.fromISO(task.Deadline).toFormat("yyyy-MM-dd'T'HH:mm")
          : ''
        : '';

      const newTargetUserId = task.targetUserId ? String(task.targetUserId) : '';
      const newCurrentFileUrl = task.FileUrl || ''; 
      setTitle(newTitle);
      setDescription(newDescription);
      setDeadline(newDeadline);
      setTargetUserId(newTargetUserId);
      setCurrentFileUrl(newCurrentFileUrl); 

    } else if (!isOpen) {
      setTitle('');
      setDescription('');
      setDeadline('');
      setTargetUserId('');
      setFile(null);
      setCurrentFileUrl(''); 
    }
  }, [isOpen, task, toast, onClose]); 

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/taskcard/available', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
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

  useEffect(() => {
      if (isOpen) {
          const selectElement = document.querySelector('select[name="targetUserId"]');
          if (selectElement) {
              const foundUser = users.find(user => String(user.id) === targetUserId);
          }
      }
  }, [isOpen, targetUserId, users]);

  useEffect(() => {
    if (!isOpen) {
      setFile(null); 
    }
  }, [isOpen]);

  const getFileNameFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const parts = pathname.split('/');
      return decodeURIComponent(parts[parts.length - 1]);
    } catch (e) {
      console.error("Error parsing file URL:", e);
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!task || typeof task.TaskId === 'undefined' || task.TaskId === null) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось определить ID задания для обновления. Пожалуйста, убедитесь, что вы редактируете задание.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append('Id', task.TaskId); 
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
    let oldFileDeleted = false; 

    try {
      if (file) {
        const fileForm = new FormData();
        fileForm.append('file', file);
        const uploadRes = await axios.post('/api/files/upload-files', fileForm, {
            headers: { Authorization: `Bearer ${token}` }
        });
        newFileUrl = uploadRes.data.fileUrl;
        formData.append('FileUrl', newFileUrl);

        if (currentFileUrl) {
            const fileNameToDelete = getFileNameFromUrl(currentFileUrl);
            if (fileNameToDelete) {
                await axios.delete(`/api/files/delete-files/${fileNameToDelete}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                oldFileDeleted = true; 
            }
        }
      } else {
        formData.append('FileUrl', currentFileUrl || '');
      }

      await axios.put('/api/taskcard/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });

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

      if (newFileUrl && !oldFileDeleted) {
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

      if (currentFileUrl && oldFileDeleted) {
        try {
          console.warn('Внимание: Восстановление оригинального файла после неудачного обновления не реализовано в текущей логике!');
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
                  value={targetUserId}
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
              {file && <Text ml="2">{file.name}</Text>}
              {!file && currentFileUrl && (
                <Text ml="2">
                    Текущий файл: <a href={currentFileUrl} target="_blank" rel="noopener noreferrer">{getFileNameFromUrl(currentFileUrl)}</a>
                </Text>
              )}
               {!file && !currentFileUrl && (
                <Text ml="2" color="gray.500">
                    Нет текущего файла.
                </Text>
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