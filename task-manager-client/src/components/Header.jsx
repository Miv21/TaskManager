import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';

export default function Header() {
  return (
    <Box bg="blue.600" color="white" px={6} py={4}>
      <Flex align="center" justify="space-between">
        <Text fontSize="xl" fontWeight="bold">Task Manager</Text>
        {/* сюда можно добавить иконку/меню */}
      </Flex>
    </Box>
  );
}