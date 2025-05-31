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
  const [targetUserId, setTargetUserId] = useState('');
  const [originalFileUrl, setOriginalFileUrl] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.title);
      setDescription(task.description);
      setDeadline(DateTime.fromISO(task.deadline).toISO({ suppressMilliseconds: true }));
      setTargetUserId(task.targetUserId);
      setOriginalFileUrl(task.fileUrl || '');
    }
  }, [isOpen, task]);

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
      setFile(null);
    }
}, [isOpen]);

  const getFileNameFromUrl = (url) => {
    try {
      return url ? decodeURIComponent(new URL(url).pathname.split('/').pop()) : null;
    } catch {
      return null;
    }
  };

  

  const handleUpdate = async () => {
    const formData = new FormData();
    formData.append('Id', task.id);
    formData.append('Title', title);
    formData.append('Description', description);

    const localDeadline = DateTime.fromISO(deadline, { zone: 'Europe/Moscow' });
    const utcDeadline = localDeadline.toUTC().toISO();
    formData.append('Deadline', utcDeadline);
    formData.append('TargetUserId', targetUserId);

    let newFileUrl = '';
    let originalFileWasDeleted = false;

    try {
      if (file) {
        const fileForm = new FormData();
        fileForm.append('file', file);
        const uploadRes = await axios.post('/api/files/upload-files', fileForm);
        newFileUrl = uploadRes.data.fileUrl;
        formData.append('FileUrl', newFileUrl);
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
      if (newFileUrl) {
        const newFileName = getFileNameFromUrl(newFileUrl);
        if (newFileName) {
          await axios.delete(`/api/files/delete-files/${newFileName}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      if (file && originalFileUrl && originalFileWasDeleted) {
        try {
          const originalFile = await fetch(originalFileUrl).then(res => res.blob());
          const filename = getFileNameFromUrl(originalFileUrl);
          const fileToReupload = new File([originalFile], filename, { type: originalFile.type });

          const reuploadForm = new FormData();
          reuploadForm.append('file', fileToReupload);

          await axios.post('/api/files/upload-files', reuploadForm, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (restoreErr) {
          console.error('Ошибка восстановления файла:', restoreErr);
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
          <FormControl mb={4}>
            <FormLabel>Пользователь</FormLabel>
            <Select borderColor="grey" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)}>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Заменить файл (необязательно)</FormLabel>
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
