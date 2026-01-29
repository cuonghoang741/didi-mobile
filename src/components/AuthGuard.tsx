import React from 'react';

export interface AuthGuardProps {
  children?: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  return <>{children}</>;
};

export default AuthGuard;


