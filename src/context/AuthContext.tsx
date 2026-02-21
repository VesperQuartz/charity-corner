import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserRole } from "../types";
import { useStore } from "./StoreContext";

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (username: string, password: string) => boolean;
  logout: () => void;
  addUser: (user: User) => void;
  deleteUser: (id: string) => void;
  hasUsers: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const KEYS = {
  USERS: "charity_corner_users_v1",
  SESSION: "charity_corner_session_v1",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [hasUsers, setHasUsers] = useState(false);
  const { logEvent } = useStore();

  useEffect(() => {
    const storedUsers = localStorage.getItem(KEYS.USERS);
    const storedSession = localStorage.getItem(KEYS.SESSION);

    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      setUsers(parsedUsers);
      setHasUsers(parsedUsers.length > 0);
    }

    if (storedSession) {
      setCurrentUser(JSON.parse(storedSession));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = users.find(
      (u) =>
        u.username.toLowerCase() === username.toLowerCase() &&
        u.password === password,
    );
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      logEvent(
        "LOGIN",
        "USER",
        `User logged in: ${user.username}`,
        user.id,
        user.name,
      );
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      logEvent(
        "LOGOUT",
        "USER",
        `User logged out: ${currentUser.username}`,
        currentUser.id,
        currentUser.name,
      );
    }
    setCurrentUser(null);
    localStorage.removeItem(KEYS.SESSION);
  };

  const addUser = (user: User) => {
    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    setHasUsers(true);
    localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
  };

  const deleteUser = (id: string) => {
    const updatedUsers = users.filter((u) => u.id !== id);
    setUsers(updatedUsers);
    setHasUsers(updatedUsers.length > 0);
    localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        addUser,
        deleteUser,
        hasUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
