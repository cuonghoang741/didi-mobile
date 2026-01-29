export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  roleId: string | null;
  dob: string | null;
  role: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  activity: string | null;
  diet: string | null;
  sleep: string | null;
  stress: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Me extends User {
  auth_type: 'email' | 'google' | 'apple' | 'facebook' | 'tiktok';
  lastSignIn: string | null;
}
