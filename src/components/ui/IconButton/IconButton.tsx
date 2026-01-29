import React from 'react';

import Button, { type ButtonProps } from '@/components/ui/Button/Button';

export interface IconButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon' | 'children'> {
  icon: React.ElementType;
  iconSize?: number;
  iconColor?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconSize = 20,
  iconColor,
  ...props
}) => {
  return (
    <Button
      startIcon={icon}
      isIconOnly
      {...props}
      startIconSize={iconSize}
      startIconColor={iconColor}
    />
  );
};

export default IconButton;
