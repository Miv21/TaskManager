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

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCreateOpen,
    onOpen: onCreateOpen,
    onClose: rawOnCreateClose,
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
                    key={task.id}
                    w="200px"
                    h="270px"
                    borderRadius="20px"
                    bg="white"
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
                    cursor="pointer"
                    onClick={() => openTaskDetails(task)}
                    transition="all 0.2s"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    flexDirection="column"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <Box 
                      h="80%" 
                      w="90%" 
                      display="flex" 
                      flexDirection="column"  
                      justifyContent="space-between" 
                      mt="10px"
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="25px 25px 15px 15px"
                    >
                      <Box borderRadius="20px">
                        <Heading
                          as="h3"
                          fontSize="md"
                          textAlign="center"
                          mb={2}
                          noOfLines={2}
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
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '50px',
                            marginLeft: '12px',
                          }}
                        >
                          {task.description}
                        </Text>
                      </Box>
                    </Box>
                    <Text fontSize="xss" color="gray.500" >
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
                    boxShadow="0 4px 12px rgba(0, 0, 0, 0.1)"
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
                      border="1px solid"
                      borderColor="gray.300"
                      borderRadius="20px 20px 15px 15px"
                      bg="polar.50"
                    >
                      <Box >
                        <Heading
                          as="h3"
                          fontSize="md"
                          textAlign="center"
                          mb={2}
                          noOfLines={2}
                        >
                          {task.title}
                        </Heading>
                        <Divider/>
                        <Text
                          fontSize="sm"
                          color="gray.700"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: '2',
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxHeight: '50px',
                            marginLeft: '12px',
                          }}
                        >
                          {task.description}
                        </Text>
                      </Box>
                    </Box>
                    
                    <Text fontSize="xss" color="gray.500" >
                      Дедлайн: {new Date(task.deadline).toLocaleDateString()}
                    </Text>
                    <Box mt={2} display="flex" gap={20} mb={3}>
                      <IconButton
                        aria-label="Редактировать"
                        icon={<EditIcon boxSize="17px" strokeWidth="2.5" />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        boxShadow="0px 4px 7px 0px rgba(0, 0, 0, 0.2)"
                        _hover={{ bg: "polar.200", color: "polar.100" }}
                        _active={{ bg: "polar.300", color: "polar.100", boxShadow: "none" }}
                        //onClick={() => handleEdit(task)}
                      />
                      <IconButton
                        aria-label="Удалить"
                        icon={<DeleteIcon boxSize="17px" strokeWidth="2.5" />}
                        size="sm"
                        colorScheme="red"
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
