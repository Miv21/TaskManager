import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Heading, Button, SimpleGrid, Text, useDisclosure, Flex, Tabs, TabList, TabPanels,
  Tab, TabPanel, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton
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
    onClose: onCreateCloseRaw,
  } = useDisclosure();

  const createButtonRef = useRef(null); 

  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/taskcard/card', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
      console.log('Ответ сервера:', res.data);
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

  const canCreateTask = user?.role === 'Employer' || user?.role === 'TopeEmployer';

  const myId = parseInt(user?.id);
  const myTasks = tasks.filter(task => task.targetUserId === myId);
  const createdTasks = tasks.filter(task => task.employerId === myId);

  const onCreateClose = () => {
    onCreateCloseRaw();
    setTimeout(() => {
      if (document.activeElement === createButtonRef.current) {
        createButtonRef.current?.blur(); 
      }
    }, 0);
  };

  console.log('Текущий пользователь:', user);
  <pre>{JSON.stringify(tasks, null, 2)}</pre>

  return (
    <Box w="100%" minH="100vh" p={2}>
      <Flex justify="space-between" align="center" mb={4} >
        <Heading></Heading>
        {canCreateTask && (
          <Button
            ref={createButtonRef}
            onClick={onCreateOpen}
            borderRadius="25"
            height="45px"
            boxShadow="0px 6px 5px 0px rgba(0, 0, 0, 0.40)"
          >
            Создать задание
          </Button>
        )}
      </Flex>

      <Tabs variant="enclosed">
        {canCreateTask && (
          <TabList borderColor="gray.400">
            <Tab borderColor="gray.400" _selected={{ borderColor: 'gray.500' }}>
              Мои задания ({myTasks.length})
            </Tab>
            <Tab borderColor="gray.400" _selected={{ borderColor: 'gray.500' }}>
              Созданные задания ({createdTasks.length})
            </Tab>
          </TabList>
        )}
        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {myTasks.length === 0 ? (
                <Text>Нет назначенных вам заданий.</Text>
              ) : (
                myTasks.map((task) => (
                  <Box
                    h="100px"
                    w="100%"
                    key={task.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="25"
                    boxShadow="sm"
                    cursor="pointer"
                    onClick={() => openTaskDetails(task)}
                    bg="white"
                  >
                    <Heading size="md" mb={2}>{task.title}</Heading>
                    <Text fontSize="sm">Создано: {new Date(task.createdAt).toLocaleString()}</Text>
                    <Text fontSize="sm">Дедлайн: {new Date(task.deadline).toLocaleString()}</Text>
                  </Box>
                ))
              )}
            </SimpleGrid>
          </TabPanel>

          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {createdTasks.length === 0 ? (
                <Text>Вы еще не создавали заданий.</Text>
              ) : (
                createdTasks.map((task) => (
                  <Box
                    key={task.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="25"
                    boxShadow="sm"
                    cursor="pointer"
                    onClick={() => openTaskDetails(task)}
                    bg="white"
                  >
                    <Heading size="md" mb={2}>{task.title}</Heading>
                    <Text fontSize="sm">Дедлайн: {new Date(task.deadline).toLocaleString()}</Text>
                  </Box>
                ))
              )}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>

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
                Ответить
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onTaskCreated={fetchTasks}
      />
    </Box>
  );
};

export default TasksPage;
