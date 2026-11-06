import { Stack } from 'expo-router';

import { largeTitleOptions } from '../../../lib/navigation';

export default function CallsLayout() {
  return (
    <Stack screenOptions={largeTitleOptions}>
      <Stack.Screen name="index" options={{ title: 'Calls' }} />
      {/* Detail screens use the small inline title, like Apple's apps. */}
      <Stack.Screen
        name="[id]"
        options={{ title: 'Call Details', headerLargeTitleEnabled: false }}
      />
    </Stack>
  );
}
