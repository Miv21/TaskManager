import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Heading, Button, SimpleGrid, Text, useDisclosure, Flex, Tabs, TabList, TabPanels,
  Tab, TabPanel, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton,
  Divider, IconButton
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../utils/useAuth';
import TaskCreateModal from '../components/TaskCreateModal';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import TaskEditModal from '../components/TaskEditModal';


const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: rawOnCreateClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  
  const [taskToEdit, setTaskToEdit] = useState(null);

  const createButtonRef = useRef(null); 

  const { user } = useAuth();
  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/taskcard/card', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      console.error('Ошибка при получении заданий', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !isCreateOpen && !isOpen) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCreateOpen, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && isOpen) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    onOpen();
  };

  const handleEditClick = (task) => {
    setTaskToEdit(task);
    onEditOpen();
  };

  const canCreateTask = user?.role === 'Employer' || user?.role === 'TopeEmployer';

  const myId = parseInt(user?.id);
  const myTasks = tasks.filter(task => task.targetUserId === myId);
  const createdTasks = tasks.filter(task => task.employerId === myId);

  const onCreateClose = () => {
    rawOnCreateClose();
    if (createButtonRef.current) {
      createButtonRef.current.blur();
    }
  };

  const handleDownload = async (id) => {
    try {
      const res = await axios.get(`/api/taskcard/file-link/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fileUrl = res.data.fileUrl;

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = ''; // имя файла будет взято из URL
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Ошибка при скачивании файла:", error);
      alert("Не удалось получить файл.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/taskcard/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (err) {
      console.error('Ошибка при удалении задания:', err);
    }
  };
  
  return (
    <Box w="100%" minH="90vh" p={2}>
      <Flex justify="space-between" align="center"  >
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
        <TabList borderColor="gray.400">
          <Tab borderColor="gray.400" _selected={{ borderColor: 'gray.500' }}>
            Мои задания ({myTasks.length})
          </Tab>
          {canCreateTask && (
            <Tab borderColor="gray.400" _selected={{ borderColor: 'gray.500' }}>
              Созданные задания ({createdTasks.length})
            </Tab>
          )}
        </TabList>
        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {myTasks.length === 0 ? (
                <Text>Нет назначенных вам заданий.</Text>
              ) : (
                myTasks.map((task) => (
                  <Box
                    key={task.id}
                    w="200px"
                    h="280px"
                    borderRadius="25px"
                    boxShadow="4px 7px 12px rgba(0, 0, 0, 0.2)"
                    cursor="pointer"
                    onClick={() => openTaskDetails(task)}
                    transition="all 0.2s"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    flexDirection="column"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: '4px 6px 16px rgba(0, 0, 0, 0.15)',
                    }}
                    bg="polar.100"
                  >
                    <Box 
                      h="80%" 
                      w="90%" 
                      display="flex" 
                      flexDirection="column"  
                      justifyContent="space-between" 
                      mt="2px"
                      borderRadius="20px 20px 15px 15px"
                      bg="polar.100"
                    >
                      <Box borderRadius="20px">
                        <Heading
                          as="h3"
                          fontSize="md"
                          textAlign="center"
                          mb={2}
                          noOfLines={2}
                          px={25}
                        >
                          {task.title}
                        </Heading>
                        <Divider/>
                        <Text
                          fontSize="sm"
                          color="gray.700"
                          marginLeft={10}
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: '7',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '145px',
                            marginLeft: '7px',
                          }}
                        >
                          {task.description}
                        </Text>
                      </Box>
                      <Divider/>
                    </Box>
                    <Text fontSize="xss" color="gray.600" mt="10px">
                      Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                    </Text>
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
                    w="200px"
                    h="280px"
                    borderRadius="25px"
                    boxShadow="4px 7px 12px rgba(0, 0, 0, 0.2)"
                    transition="all 0.2s"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    flexDirection="column"
                    bg="polar.100"
                  >
                    <Box h="80%"
                      w="90%" 
                      display="flex" 
                      flexDirection="column"  
                      justifyContent="space-between" 
                      mt="10px"
                      borderRadius="20px 20px 15px 15px"
                      bg="polar.100"
                    >
                      <Box >
                        <Heading
                          as="h3"
                          fontSize="md"
                          textAlign="center"
                          mb={2}
                          noOfLines={2}
                          px={25}
                        >
                          {task.title}
                        </Heading>
                        <Divider/>
                        <Text
                          fontSize="sm"
                          color="gray.700"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: '7',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '145px',
                            marginLeft: '12px',
                          }}
                        >
                          {task.description}
                        </Text>
                      </Box>
                      <Divider/>
                    </Box>
                    <Text fontSize="xss" color="gray.600" mt="7px">
                      Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                    </Text>
                    <Box mt={2} display="flex" gap={20} mb={3} >
                      <IconButton
                        bg= "polar.100"
                        aria-label="Редактировать"
                        icon={<EditIcon boxSize="17px" strokeWidth="2.5" />}
                        size="sm"
                        variant="ghost"
                        boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.2)"
                        _hover={{ bg: "polar.200", color: "polar.100" }}
                        _active={{ bg: "polar.300", color: "polar.100", boxShadow: "none" }}
                        onClick={() => handleEditClick(task)}
                      />
                      <IconButton
                        bg= "polar.100"
                        aria-label="Удалить"
                        icon={<DeleteIcon boxSize="17px" strokeWidth="2.5" />}
                        size="sm"
                        variant="ghost"
                        boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.2)"
                        _hover={{ bg: "polar.200", color: "polar.100" }}
                        _active={{ bg: "polar.300", color: "polar.100", boxShadow: "none" }}
                        onClick={() => handleDelete(task.id)} 
                      />
                    </Box>
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
          <ModalContent
            pt={7}
            width="450px"
            height="600px"
            borderRadius="25px"
            display="flex"
            flexDirection="column"
          >
            <ModalHeader
              as="h3"
              textAlign="center"
              mb={1}
              px={50}
            >
              {selectedTask.title}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody flex="1">
              <Box
                border="2px solid"
                borderColor="blue.100"
                borderRadius="20px"
                height="350px"
                p={4}
                overflow="auto"
              >
                <Text>{selectedTask.description}</Text>
              </Box>

              <Flex justify="space-between" mt="16" >
                {selectedTask.fileUrl ? (
                  <Button
                    as="a"
                    onClick = {() =>handleDownload(selectedTask.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    borderRadius="25"
                    boxShadow="0px 6px 5px 0px rgba(0, 0, 0, 0.40)"
                  >
                    Скачать файл
                  </Button>
                ) : (
                  <Box />
                )}

                <Button
                  variant="modal"
                  as="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  borderRadius="25"
                  boxShadow="0px 6px 5px 0px rgba(0, 0, 0, 0.40)"
                 isDisabled
                >
                  Ответить
                </Button>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onTaskCreated={fetchTasks}
      />

      <TaskEditModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        task={taskToEdit}
        onTaskUpdated={fetchTasks}
      />
    </Box>
  );
};

export default TasksPage;
