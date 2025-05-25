import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Button, Table, Thead, Tbody, Tr, Th, Td, Spinner,
  useDisclosure, Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalCloseButton, ModalBody, ModalFooter, FormControl,
  FormLabel, Input, Select, FormErrorMessage, useToast,
  InputGroup, InputRightElement, IconButton
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import axios from 'axios';

export default function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '',
    login: '',
    email: '',
    password: '',
    roleId: '',
    departmentId: '',
    positionId: ''
  });

  const [errors, setErrors] = useState({
    fullName: '',
    login: '',
    email: '',
    password: '',
    roleId: '',
    positionId: ''
  });

  const roles = [
    { value: 3, label: 'Админ' },
    { value: 1, label: 'Работодатель' },
    { value: 2, label: 'Сотрудник' },
    { value: 4, label: 'Работодатель вышего звена' }
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
  }, [toast]);

  const refresh = async () => {
    setLoading(true);
    const res = await axios.get('/api/admin/users');
    setUsers(res.data);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setShowPassword(false);
    setForm({
      fullName: '',
      login: '',
      email: '',
      password: '',
      roleId: '',
      departmentId: '',
      positionId: ''
    });
    setErrors({
      fullName: '',
      login: '',
      email: '',
      password: '',
      roleId: '',
      positionId: ''
    });
    onOpen();
  };

  const openEdit = (u) => {
    setEditing(u);
    setShowPassword(false);
    setForm({
      fullName: u.name,
      login: u.login,
      email: u.email,
      password: '',
      roleId: u.roleId.toString(),
      departmentId: u.departmentId?.toString() || '',
      positionId: u.positionId.toString()
    });
    setErrors({
      fullName: '',
      login: '',
      email: '',
      password: '',
      roleId: '',
      positionId: ''
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/admin/users/${id}`);
    toast({ status: 'success', description: 'Пользователь удалён' });
    refresh();
  };

  const validate = () => {
    const errs = {
      fullName: '',
      login: '',
      email: '',
      password: '',
      roleId: '',
      positionId: ''
    };

    const name = form.fullName.trim();
    if (!name) {
      errs.fullName = 'Фамилия и имя обязательно';
    } else {
      const words = name.split(/\s+/),
        invalidChars = /[^A-Za-zА-Яа-яЁё\s]/,
        hasDigits = /\d/;

      if (words.length < 2) {
        errs.fullName = 'Введите минимум два слова';
      } else if (hasDigits.test(name)) {
        errs.fullName = 'Не должны содержать цифры';
      } else if (invalidChars.test(name)) {
        errs.fullName = 'Содержат недопустимые символы';
      } else if (!words.every(w => /^[А-ЯЁA-Z][а-яёa-z]+$/.test(w))) {
        errs.fullName = 'Каждое слово с заглавной буквы';
      }
    }

    if (!form.login.trim()) {
      errs.login = 'Логин обязателен';
    } else if (!/^[A-Za-z0-9_]+$/.test(form.login)) {
      errs.login = 'Только буквы, цифры и подчёркивание';
    }

    if (!form.email.trim()) {
      errs.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Неверный формат email';
    }

    const password = form.password;
    if (!editing) {
      if (!password) {
        errs.password = 'Пароль обязателен';
      } else if (password.length < 8) {
        errs.password = 'Минимум 8 символов';
      } else if (!/[A-Z]/.test(password)) {
        errs.password = 'Хотя бы одна заглавная буква';
      } else if (!/^[A-Za-z0-9_\-&$]+$/.test(password)) {
        errs.password = 'Недопустимые символы в пароле';
      }
    } else if (password) {
      if (password.length < 8) {
        errs.password = 'Минимум 8 символов';
      } else if (!/[A-Z]/.test(password)) {
        errs.password = 'Хотя бы одна заглавная буква';
      } else if (!/^[A-Za-z0-9_\-&$]+$/.test(password)) {
        errs.password = 'Недопустимые символы в пароле';
      }
    }

    if (!form.roleId) errs.roleId = 'Выберите роль';
    if (!form.positionId) errs.positionId = 'Выберите должность';

    setErrors(errs);
    return !Object.values(errs).some(Boolean);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      fullName: form.fullName,
      login: form.login,
      email: form.email,
      roleId: Number(form.roleId),
      positionId: Number(form.positionId),
      ...(form.departmentId ? { departmentId: Number(form.departmentId) } : {}),
      ...(form.password ? { password: form.password } : {})
    };

    try {
      if (editing) {
        await axios.put(`/api/admin/users/${editing.id}`, payload);
        toast({ status: 'success', description: 'Пользователь обновлён' });
      } else {
        await axios.post('/api/admin/users', payload);
        toast({ status: 'success', description: 'Пользователь создан' });
      }
      onClose();
      refresh();
    } catch (err) {
      const msg = err.response?.data?.title || 'Ошибка на сервере';
      toast({ status: 'error', description: msg });
    }
  };

  return (
    <Box p={4}>
      <Button
        borderRadius="25"
        height="45px"
        boxShadow= "0px 6px 5px 0px rgba(0, 0, 0, 0.40)"
        mb={4}
        onClick={openCreate}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
      Добавить пользователя
      </Button>

      {loading ? (
        <Spinner /> 
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Имя</Th><Th>Login</Th><Th>Email</Th><Th>Роль</Th>
              <Th>Отдел</Th><Th>Должность</Th><Th>Действия</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map(u => (
              <Tr key={u.id}>
                <Td>{u.name}</Td>
                <Td>{u.login}</Td>
                <Td>{u.email}</Td>
                <Td>{u.roleName}</Td>
                <Td>{u.departmentName || '—'}</Td>
                <Td>{u.positionName}</Td>
                <Td>
                  <Button size="sm" boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.3)" mr={2} onClick={() => openEdit(u)}>✏️</Button>
                  <Button size="sm" boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.35)" variant="red" onClick={() => handleDelete(u.id)}>🗑️</Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal  isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent borderRadius="25" borderColor="grey">
          <ModalHeader>{editing ? 'Редактировать пользователя' : 'Новый пользователь'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={3} isRequired isInvalid={!!errors.fullName}>
              <FormLabel>Фамилия и имя</FormLabel>
              <Input borderColor="grey" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} />
              <FormErrorMessage>{errors.fullName}</FormErrorMessage>
            </FormControl>

            <FormControl mb={3} isRequired isInvalid={!!errors.login}>
              <FormLabel>Login</FormLabel>
              <Input borderColor="grey" value={form.login} onChange={e => setForm({ ...form, login: e.target.value })} />
              <FormErrorMessage>{errors.login}</FormErrorMessage>
            </FormControl>

            <FormControl mb={3} isRequired isInvalid={!!errors.email}>
              <FormLabel>Email</FormLabel>
              <Input borderColor="grey" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>

            <FormControl mb={3} isRequired={!editing} isInvalid={!!errors.password}>
              <FormLabel>Пароль</FormLabel>
              <InputGroup>
                <Input
                  borderColor="grey"
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                />
                <InputRightElement>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPassword(!showPassword);
                      setTimeout(() => passwordRef.current?.focus(), 0);
                    }}
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  />
                </InputRightElement>
              </InputGroup>
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>

            <FormControl mb={3} isRequired isInvalid={!!errors.roleId}>
              <FormLabel>Роль</FormLabel>
              <Select
                borderColor="grey"
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

            <FormControl mb={3}>
              <FormLabel>Отдел</FormLabel>
              <Select
                borderColor="grey"
                placeholder="Без отдела"
                value={form.departmentId}
                onChange={e => setForm({ ...form, departmentId: e.target.value })}
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={3} isRequired isInvalid={!!errors.positionId}>
              <FormLabel>Должность</FormLabel>
              <Select
                borderColor="grey"
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

          <ModalFooter justifyContent="center">
            <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" variant="modal" mr={3} onClick={handleSubmit}>Сохранить</Button>
            <Button boxShadow= "0px 4px 7px 0px rgba(0, 0, 0, 0.4)" onClick={onClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
