import React, { useState, useEffect } from 'react';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel,
  Input, useToast
} from '@chakra-ui/react';
import axios from 'axios';

export default function PositionsAdmin() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/positions');
      setPositions(res.data);
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

  const openEdit = (pos) => {
    setEditing(pos);
    setName(pos.name);
    onOpen();
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await axios.put(`/api/admin/positions/${editing.id}`, { Name: name });
        toast({ status: 'success', description: 'Должность обновлена' });
      } else {
        await axios.post('/api/admin/positions', {Name: name });
        toast({ status: 'success', description: 'Должность создана' });
      }
      onClose();
      fetchPositions();
    } catch (err) {
      toast({ status: 'error', description: err.message });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/admin/positions/${id}`);
      toast({ status: 'success', description: 'Должность удалена' });
      fetchPositions();
    } catch (err) {
      toast({ status: 'error', description: err.message });
    }
  };

  return (
    <Box p={4}>
      <Button borderRadius="25" height="45px" boxShadow= "0px 6px 5px 0px rgba(0, 0, 0, 0.40)" mb={4} onClick={openCreate}>
        Добавить должность
      </Button>

      {loading ? (
        <Spinner />
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr><Th>ID</Th><Th>Название</Th><Th>Действия с должностями</Th></Tr>
          </Thead>
          <Tbody>
            {positions.map(pos => (
              <Tr key={pos.id}>
                <Td>{pos.id}</Td>
                <Td>{pos.name}</Td>
                <Td>
                  <Button size="sm" boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.3)" mr={2} onClick={() => openEdit(pos)}>✏️</Button>
                  <Button size="sm" boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.35)" variant="red" onClick={() => handleDelete(pos.id)}>🗑️</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent borderRadius="25">
          <ModalHeader>{editing ? 'Редактировать должность' : 'Новая должность'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Название должности</FormLabel>
              <Input
                borderColor="grey"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Введите название"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter justifyContent="center">
            <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" variant="modal" mr={3} onClick={handleSave}>
              Сохранить
            </Button>
            <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" onClick={onClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}