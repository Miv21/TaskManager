import React, { useState, useEffect } from 'react';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel,
  Input, useToast
} from '@chakra-ui/react';
import axios from 'axios';

export default function DepartmentsAdmin() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/departments');
      setDepartments(res.data);
    } catch (err) {
      toast({ status: 'error', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    onOpen();
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setName(dept.name);
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`/api/admin/departments/${editing.id}`, { name });
        toast({ status: 'success', description: 'Отдел обновлён' });
      } else {
        await axios.post('/api/admin/departments', { name });
        toast({ status: 'success', description: 'Отдел создан' });
      }
      onClose();
      fetchDepartments();
    } catch (err) {
      toast({ status: 'error', description: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/departments/${id}`);
      toast({ status: 'success', description: 'Отдел удалён' });
      fetchDepartments();
    } catch (err) {
      toast({ status: 'error', description: err.message });
    }
  };

  return (
    <Box p={4}>
      <Button colorScheme="blue" mb={4} onClick={openCreate}>
        Добавить отдел
      </Button>

      {loading ? (
        <Spinner />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr><Th>ID</Th><Th>Название</Th><Th>Действия</Th></Tr>
          </Thead>
          <Tbody>
            {departments.map(dept => (
              <Tr key={dept.id}>
                <Td>{dept.id}</Td>
                <Td>{dept.name}</Td>
                <Td>
                  <Button size="sm" mr={2} onClick={() => openEdit(dept)}>✏️</Button>
                  <Button size="sm" colorScheme="red" onClick={() => handleDelete(dept.id)}>🗑️</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Редактировать отдел' : 'Новый отдел'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Название отдела</FormLabel>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введите название"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSave}>
              Сохранить
            </Button>
            <Button onClick={onClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
);
}