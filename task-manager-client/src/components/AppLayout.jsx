import React from 'react';
import { Flex, Box } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <Flex h="100vh" direction="column">
      <Header />
      <Flex flex="1">
        <Sidebar />
        <Box flex="1" bg="gray.50" p={4} overflowY="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}