export type UserRole = "admin" | "editor";

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
};

export type Session = {
  user: User;
  expires: Date;
};
