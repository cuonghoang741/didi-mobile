import { Tabs } from 'expo-router';
import {
  IconBell,
  IconBellFilled,
  IconCategory,
  IconCategoryFilled,
  IconHeart,
  IconHeartFilled,
  IconHome,
  IconHomeFilled,
  IconUser,
  IconUserFilled,
} from '@tabler/icons-react-native';
import React from 'react';

import { BottomTabBar } from '@/components';
import { useLanguage, useTheme } from '@/contexts';
import { type TabBarIconProps } from '@/types';

const TabLayout = () => {
  const theme = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }: TabBarIconProps) => {
            const Icon = focused ? IconHomeFilled : IconHome;
            return (
              <Icon
                size={24}
                color={focused ? theme.colors.text.brand_primary : theme.colors.text.secondary}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name='categories'
        options={{
          title: t('tabs.categories'),
          tabBarIcon: ({ focused }: TabBarIconProps) => {
            const Icon = focused ? IconCategoryFilled : IconCategory;
            return (
              <Icon
                size={24}
                color={focused ? theme.colors.text.brand_primary : theme.colors.text.secondary}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name='favourite'
        options={{
          title: t('tabs.favourite'),
          tabBarIcon: ({ focused }: TabBarIconProps) => {
            const Icon = focused ? IconHeartFilled : IconHeart;
            return (
              <Icon
                size={24}
                color={focused ? theme.colors.text.brand_primary : theme.colors.text.secondary}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name='notifications'
        options={{
          title: t('tabs.notifications'),
          tabBarIcon: ({ focused }: TabBarIconProps) => {
            const Icon = focused ? IconBellFilled : IconBell;
            return (
              <Icon
                size={24}
                color={focused ? theme.colors.text.brand_primary : theme.colors.text.secondary}
              />
            );
          },
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }: TabBarIconProps) => {
            const Icon = focused ? IconUserFilled : IconUser;
            return (
              <Icon
                size={24}
                color={focused ? theme.colors.text.brand_primary : theme.colors.text.secondary}
              />
            );
          },
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
