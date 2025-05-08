import React, { useState, useEffect } from 'react';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl, FormLabel,
  Input, Select, useToast
} from '@chakra-ui/react';
import axios from 'axios';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Для модалки
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    role: '', departmentId: '', positionId: ''
  });

  // Статичный список ролей (или можно завести endpoint)
  const roles = [
    { value: 'Admin', label: 'Админ' },
    { value: 'Employer', label: 'Работодатель' },
    { value: 'Employee', label: 'Сотрудник' },
  ];

  useEffect(() => {
    async function fetchAll() {
      try {
        const [u, d, p] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/departments'),
          axios.get('/api/admin/positions'),
        ]);
        setUsers(u.data);
        setDepartments(d.data);
        setPositions(p.data);
      } catch (err) {
        toast({ status: 'error', description: err.message });
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const refresh = async () => {
    setLoading(true);
    const res = await axios.get('/api/admin/users');
    setUsers(res.data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ fullName:'', email:'', password:'', role:'', departmentId:'', positionId:'' });
    onOpen();
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      fullName: user.fullName,
      email: user.email,
      password: '',
      role: user.role.name || user.role, 
      departmentId: user.departmentId,
      positionId: user.positionId
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/admin/users/${id}`);
    toast({ status: 'success', description: 'Пользователь удалён' });
    refresh();
  };

  const handleSubmit = async () => {
    const payload = {
      fullName: form.fullName,
      email: form.email,
      passwordHash: form.password, // на сервере должно хешироваться
      role: form.role,
      departmentId: +form.departmentId,
      positionId: +form.positionId
    };

    if (editing) {
      // если нужен PUT, а у вас только POST/DELETE, можно сделать две операции: delete+create
      await axios.delete(`/api/admin/users/${editing.id}`);
    }
    await axios.post('/api/admin/users', payload);
    toast({ status: 'success', description: editing ? 'Обновлено' : 'Создано' });
    onClose();
    refresh();
  };

  return (
    <Box p={4}>
      <Button colorScheme="blue" mb={4} onClick={openCreate}>
        {editing ? 'Редактировать пользователя' : 'Добавить пользователя'}
      </Button>

      {loading
        ? <Spinner />
        : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Имя</Th><Th>Email</Th><Th>Роль</Th><Th>Отдел</Th><Th>Должность</Th><Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map(u => (
                <Tr key={u.id}>
                  <Td>{u.fullName}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.role?.name || u.role}</Td>
                  <Td>{u.department?.name}</Td>
                  <Td>{u.positionId}</Td>
                  <Td>
                    <Button size="sm" mr={2} onClick={() => openEdit(u)}>✏️</Button>
                    <Button size="sm" colorScheme="red" onClick={() => handleDelete(u.id)}>🗑️</Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )
      }

      {/* Модалка для создания/редактирования */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Редактировать пользователя' : 'Новый пользователь'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/** Поля формы **/}
            {[
              { label: 'Имя', name: 'fullName', type: 'text' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Пароль', name: 'password', type: 'password' },
            ].map(f => (
              <FormControl key={f.name} mb={3}>
                <FormLabel>{f.label}</FormLabel>
                <Input
                  type={f.type} value={form[f.name]}
                  onChange={e => setForm({ ...form, [f.name]: e.target.value })}
                />
              </FormControl>
            ))}

            <FormControl mb={3}>
              <FormLabel>Роль</FormLabel>
              <Select
                placeholder="Выберите роль"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Отдел</FormLabel>
              <Select
                placeholder="Выберите отдел"
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Должность</FormLabel>
              <Select
                placeholder="Выберите должность"
                value={form.positionId}
                onChange={e => setForm({ ...form, positionId: e.target.value })}
              >
                {positions.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleSubmit}>
              Сохранить
            </Button>
            <Button onClick={onClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}