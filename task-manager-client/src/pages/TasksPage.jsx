import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Heading, Button, SimpleGrid, Text, useDisclosure, Flex,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Textarea, Divider, IconButton, useToast, Input,
  VStack, FormErrorMessage,
} from '@chakra-ui/react';
import axios from 'axios';
import { useAuth } from '../utils/useAuth';
import TaskCreateModal from '../components/TaskCreateModal';
import TaskEditModal from '../components/TaskEditModal';
import { EditIcon, DeleteIcon, AttachmentIcon } from '@chakra-ui/icons';

const TasksPage = () => {
  const [cards, setCards] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToRespond, setTaskToRespond] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseTextError, setResponseTextError] = useState(false);

  const [isFileSelectionModalOpen, setIsFileSelectionModalOpen] = useState(false);
  const [taskForFileSelection, setTaskForFileSelection] = useState(null);

  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const toast = useToast();
  const createButtonRef = useRef(null);

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: rawOnCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isResponseOpen, onOpen: onResponseOpen, onClose: _onResponseClose } = useDisclosure();

  const fetchCards = async () => {
    try {
      const res = await axios.get('/api/taskcard/card', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const normalized = res.data.map(c => ({
        Type: c.type,
        Title: c.title,
        Description: c.description,
        Deadline: c.deadline,
        TaskCreationTime: c.taskCreationTime,

        TaskId: c.taskId || null,
        ResponseId: c.responseId || null,

        FileUrl: c.fileUrl || null,

        OriginalFileUrl: c.originalFileUrl || null,

        ResponseText: c.responseText,
        targetUserId: c.targetUserId,
        TargetUserEmail: c.targetUserEmail,
      }));
      setCards(normalized);
    } catch (err) {
      console.error('Ошибка при получении карточек', err);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const myTasks = cards.filter(c => c.Type === 'MyTasks');
  const myResponses = cards.filter(c => c.Type === 'MyResponses');
  const createdTasks = cards.filter(c => c.Type === 'CreatedTasks');
  const responsesToMe = cards.filter(c => c.Type === 'ResponsesToMyTasks');


  const canCreateTask = user?.role === 'Employer' || user?.role === 'TopeEmployer';

  const onCreateClose = () => {
    rawOnCreateClose();
    createButtonRef.current?.blur();
  };

  const openTaskDetails = task => {
    setSelectedTask(task);
    onOpen();
  };

  const handleEditClick = task => {
    setTaskToRespond(null);
    setSelectedTask(task);
    setResponseText('');
    setResponseTextError(false);
    onEditOpen();
  };

  const handleDelete = async taskId => {
    try {
      await axios.delete(`/api/taskcard/delete/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCards();
      toast({ status: 'success', description: 'Задание успешно удалено.' });
    } catch (err) {
      console.error('Ошибка при удалении задания', err);
      toast({ status: 'error', description: 'Не удалось удалить.' });
    }
  };

  const handleRespondClick = task => {
    setSelectedTask(null);
    setTaskToRespond(task);
    setResponseText('');
    setFile(null);
    setResponseTextError(false);
    onResponseOpen();
  };

  const onResponseClose = () => {
    _onResponseClose();
    setTaskToRespond(null);
    setResponseText('');
    setFile(null);
    setResponseTextError(false);
  };

  const initiateFileDownload = async (id, downloadType) => {
    try {
      let requestUrl = '';
      let errorMessage = '';

      if (downloadType === 'taskFile') {
        requestUrl = `/api/taskcard/file-link/${id}`;
        errorMessage = 'Не удалось получить ссылку на файл задания.';
      } else if (downloadType === 'originalTaskFileFromResponse') {
        requestUrl = `/api/taskcard/response-file-link/${id}?fileType=originalTask`;
        errorMessage = 'Не удалось получить ссылку на файл оригинального задания из ответа.';
      } else if (downloadType === 'responseFile') {
        requestUrl = `/api/taskcard/response-file-link/${id}?fileType=response`;
        errorMessage = 'Не удалось получить ссылку на файл ответа.';
      } else {
        toast({ status: 'error', description: 'Неизвестный тип скачивания.' });
        return;
      }

      const res = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fileUrlToDownload = res.data.fileUrl;

      if (!fileUrlToDownload) {
        toast({ status: 'error', description: 'Файл не найден или недоступен для скачивания.' });
        return;
      }

      const link = document.createElement('a');
      link.href = fileUrlToDownload;
      const fileName = fileUrlToDownload.split('/').pop();
      link.download = fileName || 'download';

      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ status: 'success', description: 'Файл успешно скачан.' });
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error.response?.data?.message || error.message);
      toast({ status: 'error', description: 'Ошибка при скачивании файла: ' + (error.response?.data?.message || error.message) });
    }
  };

  const handleDownload = (task) => {
    if (task.Type === 'MyResponses' || task.Type === 'ResponsesToMyTasks') {
      if (!task.ResponseId) {
        toast({ status: 'error', description: 'ID ответа не найден для скачивания файла.' });
        return;
      }
      if (task.OriginalFileUrl || task.FileUrl) {
        setTaskForFileSelection(task);
        setIsFileSelectionModalOpen(true);
      } else {
        toast({ status: 'info', description: 'Нет файлов для скачивания в этом ответе.' });
      }
    } else {
      if (!task.TaskId) {
        toast({ status: 'error', description: 'ID задания не найден для скачивания файла.' });
        return;
      }
      if (task.FileUrl) {
        initiateFileDownload(task.TaskId, 'taskFile');
      } else {
        toast({ status: 'info', description: 'Нет файла для скачивания в этом задании.' });
      }
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      setResponseTextError(true);
      return;
    }
    setResponseTextError(false);

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (!taskToRespond || !taskToRespond.TaskId) {
        toast({ status: 'error', description: 'Не удалось получить ID оригинального задания для ответа.' });
        setIsSubmitting(false);
        return;
      }
      formData.append('TaskId', taskToRespond.TaskId);
      formData.append('ResponseText', responseText);
      if (file) formData.append('File', file);

      await axios.post(`/api/taskcard/respond`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      toast({ status: 'success', description: 'Ответ отправлен.' });
      onResponseClose();
      fetchCards();
    } catch (err) {
      console.error(err);
      toast({ status: 'error', description: 'Не удалось отправить ответ.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box w="100%" minH="90vh" p={2}>
      <Flex justify="space-between" align="center">
        <Heading>Задания</Heading>
        {canCreateTask && (
          <Button
            ref={createButtonRef}
            onClick={onCreateOpen}
            borderRadius="25"
            height="45px"
            boxShadow="0px 6px 5px rgba(0,0,0,0.4)"
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
          <Tab borderColor="gray.400" _selected={{ borderColor: 'gray.500' }}>
            Мои ответы ({myResponses.length})
          </Tab>
          {canCreateTask && (
            <Tab borderColor="gray.400" _selected={{ borderColor: 'gray.500' }}>
              Ответы на мои задания ({responsesToMe.length})
            </Tab>
          )}
        </TabList>

        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 4, lg: 6 }} spacing={1}>
              {myTasks.length === 0
                ? <Text>Нет назначенных вам заданий.</Text>
                : myTasks.map(task => (
                    <Box key={`my-task-${task.TaskId}`}
                      w="200px" h="280px" borderRadius="25px" bg="polar.100"
                      boxShadow="4px 7px 12px rgba(0,0,0,0.2)"
                      cursor="pointer"
                      onClick={() => openTaskDetails(task)}
                      transition="all .2s"
                      _hover={{
                        transform: 'translateY(-4px)',
                        boxShadow: '4px 6px 16px rgba(0,0,0,0.15)',
                      }}
                      display="flex" flexDirection="column" justifyContent="center" alignItems="center"
                    >
                      <Box
                        h="80%" w="90%"
                        display="flex" flexDirection="column" justifyContent="space-between"
                        mt="2px" borderRadius="20px 20px 15px 15px" bg="polar.100"
                      >
                        <Box borderRadius="20px">
                          <Heading as="h3" fontSize="md" textAlign="center" mb={2} noOfLines={2} px={25}>
                            {task.Title}
                          </Heading>
                          <Divider />
                          <Text fontSize="sm" color="gray.700"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 7,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxHeight: '145px',
                              marginLeft: '12px',
                            }}
                          >
                            {task.Description}
                          </Text>
                        </Box>
                        <Divider />
                      </Box>
                      <Text fontSize="xss" color="gray.600" mt="7px">
                        Дедлайн: {new Date(task.Deadline).toLocaleDateString()}
                      </Text>
                    </Box>
                  ))}
            </SimpleGrid>
          </TabPanel>

          {canCreateTask && (
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 4, lg: 6 }} spacing={1}>
                {createdTasks.length === 0
                  ? <Text>Вы еще не создавали заданий.</Text>
                  : createdTasks.map(task => (
                      <Box key={`created-task-${task.TaskId}`}
                        w="200px" h="280px" borderRadius="25px" bg="polar.100"
                        boxShadow="4px 7px 12px rgba(0,0,0,0.2)"
                        transition="all .2s"
                        display="flex" flexDirection="column" justifyContent="center" alignItems="center"
                        _hover={{
                          transform: 'translateY(-4px)',
                          boxShadow: '4px 6px 16px rgba(0,0,0,0.15)',
                        }}
                      >
                        <Box
                          h="80%" w="90%"
                          display="flex" flexDirection="column" justifyContent="space-between"
                          mt="2px" borderRadius="20px 20px 15px 15px" bg="polar.100"
                        >
                          <Box borderRadius="20px">
                            <Heading as="h3" fontSize="md" textAlign="center" mb={2} noOfLines={2} px={25}>
                              {task.Title}
                            </Heading>
                            <Divider />
                            <Text fontSize="sm" color="gray.700"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 7,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxHeight: '145px',
                                marginLeft: '12px',
                              }}
                            >
                              {task.Description}
                            </Text>
                          </Box>
                          <Divider />
                        </Box>
                        <Text fontSize="xss" color="gray.600" mt="7px">
                          Дедлайн: {new Date(task.Deadline).toLocaleDateString()}
                        </Text>
                        <Box mt={2} display="flex" gap={4} mb={3}>
                          <IconButton
                            aria-label="Редактировать"
                            icon={<EditIcon boxSize="17px" strokeWidth="2.5" />}
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleEditClick(task); }}
                          />
                          <IconButton
                            aria-label="Удалить"
                            icon={<DeleteIcon boxSize="17px" strokeWidth="2.5" />}
                            size="sm"
                            variant="ghost"
                            onClick={(e) => { e.stopPropagation(); handleDelete(task.TaskId); }}
                          />
                        </Box>
                      </Box>
                    ))}
              </SimpleGrid>
            </TabPanel>
          )}

          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 4, lg: 6 }} spacing={1}>
              {myResponses.length === 0
                ? <Text>Вы еще не отвечали на задания.</Text>
                : myResponses.map(response => (
                    <Box key={`my-response-${response.ResponseId}`}
                      w="200px" h="280px" borderRadius="25px" bg="polar.100"
                      boxShadow="4px 7px 12px rgba(0,0,0,0.2)"
                      transition="all .2s"
                      display="flex" flexDirection="column" justifyContent="center" alignItems="center"
                      _hover={{
                        transform: 'translateY(-4px)',
                        boxShadow: '4px 6px 16px rgba(0,0,0,0.15)',
                      }}
                    >
                      <Box
                        h="80%" w="90%"
                        display="flex" flexDirection="column" justifyContent="space-between"
                        mt="2px" borderRadius="20px 20px 15px 15px" bg="polar.100"
                      >
                        <Box borderRadius="20px">
                          <Heading as="h3" fontSize="md" textAlign="center" mb={2} noOfLines={2} px={25}>
                            {response.Title}
                          </Heading>
                          <Divider />
                          <Text fontSize="sm" color="gray.700"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 7,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxHeight: '145px',
                              marginLeft: '12px',
                            }}
                          >
                            {response.ResponseText}
                          </Text>
                          {response.ResponseText && (
                            <Text fontSize="xs" color="gray.500" mt={2} noOfLines={2}>
                              Ваше задание: "{response.Description}"
                            </Text>
                          )}
                        </Box>
                        <Divider />
                      </Box>
                      <Text fontSize="xss" color="gray.600" mt="7px">
                        Дедлайн: {new Date(response.Deadline).toLocaleDateString()}
                      </Text>
                      <Text fontSize="xss" color="gray.600" mt="7px" mb={3}>
                        Сдано: {new Date(response.TaskCreationTime).toLocaleDateString()}
                      </Text>
                      {/* <Box mt={2} display="flex" mb={3}>
                        <IconButton
                          aria-label="Редактировать ответ"
                          icon={<EditIcon boxSize="17px" strokeWidth="2.5" />}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); handleEditClick(response); }}
                        />
                      </Box> */}
                    </Box>
                  ))}
            </SimpleGrid>
          </TabPanel>

          {canCreateTask && (
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 4, lg: 6 }} spacing={1}>
                {responsesToMe.length === 0
                  ? <Text>На ваши задания еще нет ответов.</Text>
                  : responsesToMe.map(response => (
                      <Box key={`responses-to-me-${response.ResponseId}`}
                        w="200px" h="280px" borderRadius="25px" bg="polar.100"
                        boxShadow="4px 7px 12px rgba(0,0,0,0.2)"
                        cursor="pointer"
                        onClick={() => openTaskDetails(response)}
                        transition="all .2s"
                        display="flex" flexDirection="column" justifyContent="center" alignItems="center"
                        _hover={{
                          transform: 'translateY(-4px)',
                          boxShadow: '4px 6px 16px rgba(0,0,0,0.15)',
                        }}
                      >
                        <Box
                          h="80%" w="90%"
                          display="flex" flexDirection="column" justifyContent="space-between"
                          mt="2px" borderRadius="20px 20px 15px 15px" bg="polar.100"
                        >
                          <Box borderRadius="20px">
                            <Heading as="h3" fontSize="md" textAlign="center" mb={2} noOfLines={2} px={25}>
                              {response.Title}
                            </Heading>
                            <Divider />
                            <Text fontSize="sm" color="gray.700" marginLeft="7px"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 7,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxHeight: '145px',
                              }}
                            >
                              {response.ResponseText}
                            </Text>
                            {response.ResponseText && (
                              <Text fontSize="xs" color="gray.500" mt={2} noOfLines={2}>
                                Задание: "{response.Description}"
                              </Text>
                            )}
                          </Box>
                          <Divider />
                        </Box>
                        <Text fontSize="xss" color="gray.600" mt="10px">
                          Дедлайн: {new Date(response.Deadline).toLocaleDateString()}
                        </Text>
                        <Text fontSize="xss" color="gray.600" mt="7px" mb={3}>
                          Сдано: {new Date(response.TaskCreationTime).toLocaleDateString()}
                        </Text>
                      </Box>
                    ))}
              </SimpleGrid>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>

      {/* Просмотр задания */}
      {selectedTask && (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
          <ModalOverlay />
          <ModalContent
            pt={7} width="450px" height="600px"
            borderRadius="25px" display="flex" flexDirection="column"
          >
            <ModalHeader textAlign="center" mb={1} px={50}>
              {selectedTask.Title}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody flex="1">
              {(selectedTask.Type === 'MyTasks' || selectedTask.Type === 'CreatedTasks') ? (

                <Box
                  border="2px solid" borderColor="blue.100"
                  borderRadius="20px" height="350px" p={4} overflow="auto"
                >
                  <Text>{selectedTask.Description}</Text>
                </Box>
              ) : (
                <Tabs isFitted variant="enclosed" defaultIndex={selectedTask.ResponseText ? 0 : 1}>
                  <TabList borderColor="gray.300" mb="1em">
                    <Tab borderColor="gray.300" _selected={{ borderColor: 'gray.400' }}>Ответ</Tab>
                    <Tab borderColor="gray.300" _selected={{ borderColor: 'gray.400' }}>Описание</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel>
                      <Box
                        border="2px solid" borderColor="blue.100"
                        borderRadius="20px" height="300px" p={4} overflow="auto"
                      >
                        <Text>{selectedTask.ResponseText || "Ответ на данное задание отсутствует."}</Text>
                      </Box>
                    </TabPanel>
                    <TabPanel>
                      <Box
                        border="2px solid" borderColor="blue.100"
                        borderRadius="20px" height="300px" p={4} overflow="auto"
                      >
                        <Text>{selectedTask.Description}</Text>
                      </Box>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              )}

              <Flex justify="center" mt="10">
                {(selectedTask.FileUrl || selectedTask.OriginalFileUrl) ? (
                  <Button
                    onClick={() => handleDownload(selectedTask)}
                    borderRadius="25"
                    boxShadow="0px 6px 5px rgba(0,0,0,0.4)"
                    mr={(selectedTask.Type === 'MyTasks' && !selectedTask.ResponseText) || selectedTask.Type === 'CreatedTasks' ? "4" : "0"}
                  >
                    Скачать файл
                  </Button>
                ) : (
                  <Box />
                )}

                {selectedTask.Type === 'MyTasks' && !selectedTask.ResponseText && (
                  <Button
                    variant="modal"
                    onClick={() => handleRespondClick(selectedTask)}
                    borderRadius="25"
                    boxShadow="0px 6px 5px rgba(0,0,0,0.4)"
                  >
                    Ответить
                  </Button>
                )}
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Модалка для выбора файла скачивания */}
      {taskForFileSelection && (
        <Modal
          isOpen={isFileSelectionModalOpen}
          onClose={() => setIsFileSelectionModalOpen(false)}
          isCentered
          size="md"
        >
          <ModalOverlay />
          <ModalContent borderRadius="25px" p={4}>
            <ModalHeader textAlign="center" pb={0}>
              Какой файл вы хотите скачать?
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} mt={4} justify="center">
                {taskForFileSelection.OriginalFileUrl && taskForFileSelection.ResponseId && (
                  <Button
                    onClick={() => {
                      initiateFileDownload(taskForFileSelection.ResponseId, 'originalTaskFileFromResponse');
                      setIsFileSelectionModalOpen(false);
                    }}
                    borderRadius="25"
                    boxShadow="0px 6px 5px rgba(0,0,0,0.4)"
                    w="80%"
                  >
                    Скачать файл задания
                  </Button>
                )}

                {taskForFileSelection.FileUrl && taskForFileSelection.ResponseId && (
                  <Button
                    onClick={() => {
                      initiateFileDownload(taskForFileSelection.ResponseId, 'responseFile');
                      setIsFileSelectionModalOpen(false);
                    }}
                    borderRadius="25"
                    boxShadow="0px 6px 5px rgba(0,0,0,0.4)"
                    w="80%"
                  >
                    Скачать файл ответа
                  </Button>
                )}

                {(!taskForFileSelection.OriginalFileUrl && !taskForFileSelection.FileUrl) && (
                  <Text fontSize="sm" color="gray.500">
                    Нет файлов для скачивания.
                  </Text>
                )}
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Отправка ответа */}
      {isResponseOpen && taskToRespond && (
        <Modal isOpen={isResponseOpen} onClose={onResponseClose} isCentered size="lg">
          <ModalOverlay />
          <ModalContent borderRadius="25px" p={5}>
            <ModalHeader textAlign="center">Ответ на задание</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={4} isInvalid={responseTextError}> {/* Добавляем isInvalid */}
                <FormLabel>Ваш ответ</FormLabel>
                <Textarea
                  height="180px"
                  borderColor="grey"
                  value={responseText}
                  onChange={e => {
                    setResponseText(e.target.value);
                    // Сбрасываем ошибку, как только пользователь начинает печатать
                    if (responseTextError) {
                      setResponseTextError(false);
                    }
                  }}
                />
                {responseTextError && ( // Показываем сообщение об ошибке, если есть ошибка
                  <FormErrorMessage>Текст ответа обязателен для заполнения.</FormErrorMessage>
                )}
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Прикрепить файл (необязательно)</FormLabel>
                <Flex align="center">
                  <Input
                    type="file"
                    display="none"
                    id="file-upload"
                    onChange={e => setFile(e.target.files[0])}
                  />
                  <IconButton
                    as="label"
                    htmlFor="file-upload"
                    icon={<AttachmentIcon />}
                    variant="outline"
                    borderColor="gray"
                    aria-label="Загрузить файл"
                  />
                  {file && <Text ml="2">{file.name}</Text>}
                </Flex>
              </FormControl>
              <Button
                mt={4}
                w="100%"
                colorScheme="blue"
                borderRadius="20px"
                onClick={handleSubmitResponse}
                isLoading={isSubmitting}
              >
                Отправить
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Создание */}
      <TaskCreateModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onTaskCreated={fetchCards}
      />

      {/* Редактирование */}
      <TaskEditModal
        isOpen={isEditOpen}
        onClose={onEditClose}
        task={selectedTask}
        onTaskUpdated={fetchCards}
      />
    </Box>
  );
};

export default TasksPage;