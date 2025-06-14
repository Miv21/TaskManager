import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Heading, Button, SimpleGrid, Text, useDisclosure, Flex,
  Tabs, TabList, TabPanels, Tab, TabPanel,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  FormControl, FormLabel, Textarea, Divider, IconButton, useToast, Input,
  VStack, HStack
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
        Id: c.id,
        Type: c.type, // 'MyTasks', 'CreatedTasks', 'MyResponses', 'ResponsesToMyTasks'
        Title: c.title,
        Description: c.description,
        Deadline: c.deadline,

        // Для заданий (MyTasks, CreatedTasks), fileUrl из бэкенда - это файл задания.
        // Для ответов (MyResponses, ResponsesToMyTasks), fileUrl из бэкенда - это файл ответа.
        FileUrl: c.fileUrl,

        // Это поле будет присутствовать ТОЛЬКО для карточек типа 'MyResponses' и 'ResponsesToMyTasks'
        // и будет содержать ссылку на файл оригинального задания.
        OriginalFileUrl: c.originalFileUrl || null,

        ResponseText: c.responseText, // Присутствует для ответов
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

  // Фильтрация карточек
  const myTasks = cards.filter(c =>
    c.Type === 'MyTasks' &&
    (c.targetUserId === user?.id || c.TargetUserEmail === user?.email) &&
    !c.ResponseText // Предполагаем, что ResponseText есть только у ответов
  );

  const myResponses = cards.filter(c =>
    c.Type === 'MyResponses'
  );

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
    setSelectedTask(null);
    setResponseText('');
    onEditOpen();
    setSelectedTask(task);
  };

  const handleDelete = async id => {
    try {
      await axios.delete(`/api/taskcard/delete/${id}`, {
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
    onResponseOpen();
  };

  const onResponseClose = () => {
    _onResponseClose();
    setTaskToRespond(null);
    setResponseText('');
    setFile(null);
  };

  // Функция для инициации скачивания файла через бэкенд
  const initiateFileDownload = async (id, downloadType) => {
    try {
      let requestUrl = '';
      let errorMessage = '';

      if (downloadType === 'taskFile') { // Для скачивания файла из 'TaskCard' (используем ID задания)
        requestUrl = `/api/taskcard/file-link/${id}`;
        errorMessage = 'Не удалось получить ссылку на файл задания.';
      } else if (downloadType === 'originalTaskFileFromResponse') { // Для файла оригинального задания ИЗ TaskResponse (используем ID ответа)
          requestUrl = `/api/taskcard/response-file-link/${id}?fileType=originalTask`;
          errorMessage = 'Не удалось получить ссылку на файл оригинального задания из ответа.';
      } else if (downloadType === 'responseFile') { // Для файла ответа ИЗ TaskResponse (используем ID ответа)
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
      console.error('Ошибка при скачивании файла:', error.response?.data || error.message);
      toast({ status: 'error', description: 'Произошла ошибка при скачивании файла.' });
    }
  };

  // Логика открытия модалки выбора файла или прямого скачивания
  const handleDownload = (task) => {
    // Если это карточка ответа (MyResponses или ResponsesToMyTasks)
    if (task.Type === 'MyResponses' || task.Type === 'ResponsesToMyTasks') {
      // Проверяем наличие обоих типов файлов в TaskResponse
      if (task.OriginalFileUrl || task.FileUrl) { // FileUrl здесь - это файл ответа
        setTaskForFileSelection(task);
        setIsFileSelectionModalOpen(true); // Открываем модалку выбора
      } else {
        toast({ status: 'info', description: 'Нет файлов для скачивания в этом ответе.' });
      }
    } else { // Для заданий (MyTasks, CreatedTasks)
      // Здесь FileUrl - это файл самого задания
      if (task.FileUrl) {
        initiateFileDownload(task.Id, 'taskFile'); // Используем ID задания
      } else {
        toast({ status: 'info', description: 'Нет файла для скачивания в этом задании.' });
      }
    }
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim() && !file) {
      toast({ status: 'error', description: 'Ответ не может быть пустым или без файла.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('TaskId', taskToRespond.Id); // ID оригинального задания
      formData.append('ResponseText', responseText);
      if (file) formData.append('File', file);

      await axios.post(`/api/taskcard/respond/${taskToRespond.Id}`, formData, {
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
                  <Box key={task.Id}
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
                ))
              }
            </SimpleGrid>
          </TabPanel>

          {canCreateTask && (
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 4, lg: 6 }} spacing={1}>
                {createdTasks.length === 0
                  ? <Text>Вы еще не создавали заданий.</Text>
                  : createdTasks.map(task => (
                    <Box key={task.Id}
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
                          onClick={(e) => { e.stopPropagation(); handleDelete(task.Id); }}
                        />
                      </Box>
                    </Box>
                  ))
                }
              </SimpleGrid>
            </TabPanel>
          )}

          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 4, lg: 6 }} spacing={1}>
              {myResponses.length === 0
                ? <Text>Вы еще не отвечали на задания.</Text>
                : myResponses.map(task => (
                  <Box key={task.Id}
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
                        {task.ResponseText && (
                          <Text fontSize="xs" color="gray.500" mt={2} noOfLines={2}>
                            Ваш ответ: "{task.ResponseText}"
                          </Text>
                        )}
                      </Box>
                      <Divider />
                    </Box>
                    <Text fontSize="xss" color="gray.600" mt="7px">
                      Дедлайн: {new Date(task.Deadline).toLocaleDateString()}
                    </Text>
                    <Box>
                      <IconButton
                        aria-label="Редактировать"
                        icon={<EditIcon boxSize="17px" strokeWidth="2.5" />}
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); handleEditClick(task); }}
                      />
                    </Box>
                  </Box>
                ))
              }
            </SimpleGrid>
          </TabPanel>

          {canCreateTask && (
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 4, lg: 6 }} spacing={1}>
                {responsesToMe.length === 0
                  ? <Text>На ваши задания еще нет ответов.</Text>
                  : responsesToMe.map(response => (
                    <Box key={response.Id}
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
                            {response.Description}
                          </Text>
                          {response.ResponseText && (
                            <Text fontSize="xs" color="gray.500" mt={2} noOfLines={2}>
                              Ответ: "{response.ResponseText}"
                            </Text>
                          )}
                        </Box>
                        <Divider />
                      </Box>
                      <Text fontSize="xss" color="gray.600" mt="10px">
                        Дедлайн: {new Date(response.Deadline).toLocaleDateString()}
                      </Text>
                    </Box>
                  ))
                }
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
              <Box
                border="2px solid" borderColor="blue.100"
                borderRadius="20px" height="350px" p={4} overflow="auto"
              >
                <Text>{selectedTask.Description}</Text>
                {selectedTask.ResponseText && (
                  <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
                    <Heading as="h4" size="sm" mb={2}>Ответ:</Heading>
                    <Text>{selectedTask.ResponseText}</Text>
                  </Box>
                )}
              </Box>
              <Flex justify="center" mt="16">
                {/* Условие для кнопки "Скачать файл" в модалке просмотра */}
                {(selectedTask.FileUrl || selectedTask.OriginalFileUrl) ? (
                  <Button
                    onClick={() => handleDownload(selectedTask)}
                    borderRadius="25"
                    boxShadow="0px 6px 5px rgba(0,0,0,0.4)"
                    mr={selectedTask.Type === 'MyTasks' && !selectedTask.ResponseText ? "4" : "0"}
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
                {/* Добавляем кнопки редактирования/удаления для "Созданных заданий" здесь */}
                {selectedTask.Type === 'CreatedTasks' && (
                  <HStack ml={4}>
                    <IconButton
                      aria-label="Редактировать"
                      icon={<EditIcon boxSize="17px" strokeWidth="2.5" />}
                      size="sm"
                      variant="ghost"
                      onClick={() => { onClose(); handleEditClick(selectedTask); }}
                    />
                    <IconButton
                      aria-label="Удалить"
                      icon={<DeleteIcon boxSize="17px" strokeWidth="2.5" />}
                      size="sm"
                      variant="ghost"
                      onClick={() => { onClose(); handleDelete(selectedTask.Id); }}
                    />
                  </HStack>
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
                {/* Кнопка для скачивания файла оригинального задания (OriginalFileUrl из TaskResponse) */}
                {taskForFileSelection.OriginalFileUrl && (
                  <Button
                    onClick={() => {
                      // Для TaskResponse используем Id самой TaskResponse
                      initiateFileDownload(taskForFileSelection.Id, 'originalTaskFileFromResponse');
                      setIsFileSelectionModalOpen(false);
                    }}
                    borderRadius="25"
                    boxShadow="0px 6px 5px rgba(0,0,0,0.4)"
                    w="80%"
                  >
                    Скачать файл задания
                  </Button>
                )}

                {/* Кнопка для скачивания файла ответа (FileUrl из TaskResponse) */}
                {taskForFileSelection.FileUrl && (
                  <Button
                    onClick={() => {
                      // Для TaskResponse используем Id самой TaskResponse
                      initiateFileDownload(taskForFileSelection.Id, 'responseFile');
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
              <FormControl mb={4}>
                <FormLabel>Ваш ответ</FormLabel>
                <Textarea
                  height="180px"
                  borderColor="grey"
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Прикрепить файл</FormLabel>
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