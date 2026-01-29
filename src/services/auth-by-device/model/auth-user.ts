export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  password: string | null;
  roleId: number | null;
  googleId: string | null;
  appleId: string | null;
  deviceId: string | null;
  authType: 'email' | 'google' | 'apple' | 'facebook' | 'tiktok' | null;
  lastSignIn: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface Me extends User {
  // Me interface inherits all User properties
  // Additional properties can be added here if needed
}
