import React from 'react'; 
import { Flex, Box } from '@chakra-ui/react';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';
import UserCard from './UserCard';

export default function AppLayout() {
  return (
    <Flex h="100vh">
      <Flex
        direction="column"
        width="300px"
        my="10px"
        ml="5px"
        mr="4px"
        gap="8px"
        // УБРАТЬ justify="space-between"
      >
        <Sidebar />
        <UserCard />
      </Flex>

      <Box
        flex="1"
        bg="gray"
        p={4}
        overflowY="auto"
        borderRadius="25"
        boxShadow="0 0 10px rgba(0, 0, 0, 0.1)"
        my="10px"
        ml="4px"
        mr="5px"
        display="flex"
      >
        <Outlet />
      </Box>
    </Flex>
  );
}