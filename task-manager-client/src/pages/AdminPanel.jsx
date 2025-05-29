import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import UsersAdmin from '../components/UsersAdmin';
import DepartmentsAdmin from '../components/DepartmentsAdmin';
import PositionsAdmin from '../components/PositionsAdmin';

export default function AdminPanel() {
  return (
    <Tabs variant="enclosed" isLazy>
      <TabList borderColor="gray.400">  
        <Tab borderColor="gray.400" _selected={{  borderColor: 'gray.500' }}>Пользователи </Tab>
        <Tab borderColor="gray.400" _selected={{  borderColor: 'gray.500' }}>Отделы</Tab>
        <Tab borderColor="gray.400" _selected={{  borderColor: 'gray.500' }}>Должности</Tab>
      </TabList>

      <TabPanels>
        <TabPanel>
          <UsersAdmin />
        </TabPanel>
        <TabPanel>
          <DepartmentsAdmin />
        </TabPanel>
        <TabPanel>
          <PositionsAdmin />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}