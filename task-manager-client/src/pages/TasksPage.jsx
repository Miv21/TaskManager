import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Button, SimpleGrid, Text, useDisclosure, Flex,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../utils/useAuth';
import TaskCreateModal from '../components/TaskCreateModal';


const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: onCreateClose,
  } = useDisclosure();

  const { user } = useAuth(); // получаем текущего пользователя

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/taskcard');
      setTasks(res.data);
    } catch (error) {
      console.error('Ошибка при получении заданий', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    onOpen();
  };

  // Проверка на доступность создания заданий
  const canCreateTask = user?.role === 'Employer' || user?.role === 'TopeEmployer';

  return (
    <Box p={6}>
      <Flex justify="space-between" mb={4}>
        <Heading size="lg">Задания</Heading>
        {canCreateTask && (
          <Button colorScheme="blue" onClick={onCreateOpen}>
            Создать задание
          </Button>
        )}
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {tasks.map((task) => (
          <Box
            key={task.id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            boxShadow="sm"
            cursor="pointer"
            onClick={() => openTaskDetails(task)}
          >
            <Heading size="md" mb={2}>{task.title}</Heading>
            <Text fontSize="sm">Создано: {new Date(task.createdAt).toLocaleString()}</Text>
            <Text fontSize="sm">Дедлайн: {new Date(task.deadline).toLocaleString()}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {selectedTask && (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{selectedTask.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text mb={4}>{selectedTask.description}</Text>
              {selectedTask.fileUrl && (
                <Button
                  as="a"
                  href={selectedTask.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  colorScheme="blue"
                  mb={4}
                >
                  Скачать файл
                </Button>
              )}
              <Button colorScheme="green" isDisabled>
                Ответить (в будущем)
              </Button>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose}>Закрыть</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <TaskCreateModal isOpen={isCreateOpen} onClose={onCreateClose} onTaskCreated={fetchTasks} />
    </Box>
  );
};

export default TasksPage;
