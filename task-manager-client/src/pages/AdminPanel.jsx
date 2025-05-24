import React from 'react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import UsersAdmin from '../components/UsersAdmin';
import DepartmentsAdmin from '../components/DepartmentsAdmin';
import PositionsAdmin from '../components/PositionsAdmin';

export default function AdminPanel() {
  return (
    <Tabs variant="enclosed" isLazy>
      <TabList borderColor="gray">  
        <Tab _selected={{  borderColor: 'gray' }}>Пользователи </Tab>
        <Tab _selected={{  borderColor: 'gray' }}>Отделы</Tab>
        <Tab _selected={{  borderColor: 'gray' }}>Должности</Tab>
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