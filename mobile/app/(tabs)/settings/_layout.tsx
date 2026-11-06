import { Stack } from 'expo-router';

import { largeTitleOptions } from '../../../lib/navigation';

export default function Layout() {
  return (
    <Stack screenOptions={largeTitleOptions}>
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen
        name="rules"
        options={{ title: 'Rules', headerLargeTitleEnabled: false }}
      />
    </Stack>
  );
}
