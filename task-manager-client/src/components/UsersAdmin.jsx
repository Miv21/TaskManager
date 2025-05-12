import React, { useState, useEffect } from 'react';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl,
  FormLabel, Input, Select, FormErrorMessage, useToast
} from '@chakra-ui/react';
import axios from 'axios';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    fullName: '', email: '', password: '',
    roleId: '', departmentId: '', positionId: ''
  });
  const [errors, setErrors] = useState({
    fullName: '', email: '', password: '',
    roleId: '', positionId: ''
  });

  const roles = [
    { value: 3, label: 'Админ' },
    { value: 1, label: 'Работодатель' },
    { value: 2, label: 'Сотрудник' },
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
    setForm({ fullName:'', email:'', password:'', roleId:'', departmentId:'', positionId:'' });
    setErrors({ fullName:'', email:'', password:'', roleId:'', positionId:'' });
    onOpen();
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      fullName: u.name,
      email: u.email,
      password: '',
      roleId: u.roleId.toString(),
      departmentId: u.departmentId?.toString() || '',
      positionId: u.positionId.toString()
    });
    setErrors({ fullName:'', email:'', password:'', roleId:'', positionId:'' });
    onOpen();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/admin/users/${id}`);
    toast({ status: 'success', description: 'Пользователь удалён' });
    refresh();
  };

  // Валидация на клиенте
  const validate = () => {
    const errs = { fullName: '', email: '', password: '', roleId: '', positionId: '' };
    if (!form.fullName.trim()) errs.fullName = 'Имя обязательно';
    if (!form.email.trim()) errs.email = 'Email обязателен';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Неверный формат email';

    if (!editing) {
      if (!form.password) errs.password = 'Пароль обязателен';
      else if (form.password.length < 6)
      errs.password = 'Пароль должен быть не короче 6 символов';
    } else if (form.password && form.password.length < 6) {
      errs.password = 'Пароль должен быть не короче 6 символов';
    }

    if (!form.roleId) errs.roleId = 'Выберите роль';
    if (!form.positionId) errs.positionId = 'Выберите должность';
    setErrors(errs);
    return !Object.values(errs).some(e => e);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      fullName: form.fullName,
      email:    form.email,
      roleId:   Number(form.roleId),
      positionId: Number(form.positionId),
      ...(form.departmentId ? { departmentId: Number(form.departmentId) } : {}),
      ...(form.password ? { password: form.password } : {})
    };

    try {
      if (editing) {
        await axios.put(`/api/admin/users/${editing.id}`, payload);
      } else {
        await axios.post('/api/admin/users', payload);
      }
      toast({ status: 'success', description: editing ? 'Обновлено' : 'Создано' });
      onClose();
      refresh();
    } catch (err) {
      const msg = err.response?.data?.title || 'Ошибка на сервере';
      toast({ status: 'error', description: msg });
    }
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
                <Th>Имя</Th><Th>Email</Th><Th>Роль</Th>
                <Th>Отдел</Th><Th>Должность</Th><Th>Действия с пользователями</Th>
              </Tr>
            </Thead>
            <Tbody>
              {users.map(u => (
                <Tr key={u.id}>
                  <Td>{u.name}</Td>
                  <Td>{u.email}</Td>
                  <Td>{u.roleName}</Td>
                  <Td>{u.departmentName || '—'}</Td>
                  <Td>{u.positionName}</Td>
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

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editing ? 'Редактировать пользователя' : 'Новый пользователь'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Имя */}
            <FormControl mb={3} isRequired isInvalid={!!errors.fullName}>
              <FormLabel>Имя</FormLabel>
              <Input
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
              />
              <FormErrorMessage>{errors.fullName}</FormErrorMessage>
            </FormControl>

            {/* Email */}
            <FormControl mb={3} isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            {/* Пароль */}
            <FormControl mb={3} isRequired isInvalid={!!errors.password}>
              <FormLabel>Пароль</FormLabel>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            {/* Роль */}
            <FormControl mb={3} isRequired isInvalid={!!errors.roleId}>
              <FormLabel>Роль</FormLabel>
              <Select
                placeholder="Выберите роль"
                value={form.roleId}
                onChange={e => setForm({ ...form, roleId: e.target.value })}
              >
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </Select>
              <FormErrorMessage>{errors.roleId}</FormErrorMessage>
            </FormControl>

            {/* Отдел (необязательно) */}
            <FormControl mb={3}>
              <FormLabel>Отдел (необязательно)</FormLabel>
              <Select
                placeholder="Без отдела"
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </FormControl>

            {/* Должность */}
            <FormControl mb={3} isRequired isInvalid={!!errors.positionId}>
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
              <FormErrorMessage>{errors.positionId}</FormErrorMessage>
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