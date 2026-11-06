import type { ComponentProps } from 'react';
import type { Stack } from 'expo-router';

type StackOptions = NonNullable<ComponentProps<typeof Stack>['screenOptions']>;

// iOS-style headers: a large title that collapses into the bar as you
// scroll, over a translucent header the content slides under. The native
// stack does all of this on the UI side — nothing is animated in JS.
// Screens need contentInsetAdjustmentBehavior="automatic" on their root
// ScrollView so content starts below the large title.
export const largeTitleOptions: StackOptions = {
  headerLargeTitleEnabled: true,
  headerTransparent: true,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
};
