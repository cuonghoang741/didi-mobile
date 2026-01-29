import { Tabs } from 'expo-router';
import { Heart, Home, MenuBoard } from 'iconsax-react-nativejs';
import React from 'react';

import { BottomTabBar, Typography } from '@/components';
import { useLanguage, useTheme } from '@/contexts';
import { type TabBarIconProps } from '@/types';

const TabLayout = () => {
  const theme = useTheme();
  const { t } = useLanguage();

  return <></>;
};

export default TabLayout;
