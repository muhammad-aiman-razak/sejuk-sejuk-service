"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@/types";

interface AuthContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  isAdmin: boolean;
  isTechnician: boolean;
  isManager: boolean;
}

const SEED_USERS: User[] = [
  {
    id: "c1000000-0000-0000-0000-000000000001",
    name: "Sarah (Admin)",
    email: "sarah@sejuksejuk.com",
    role: "admin",
    technician_id: null,
    created_at: "",
  },
  {
    id: "c1000000-0000-0000-0000-000000000002",
    name: "Ali",
    email: "ali@sejuksejuk.com",
    role: "technician",
    technician_id: "a1000000-0000-0000-0000-000000000001",
    created_at: "",
  },
  {
    id: "c1000000-0000-0000-0000-000000000003",
    name: "John",
    email: "john@sejuksejuk.com",
    role: "technician",
    technician_id: "a1000000-0000-0000-0000-000000000002",
    created_at: "",
  },
  {
    id: "c1000000-0000-0000-0000-000000000004",
    name: "Bala",
    email: "bala@sejuksejuk.com",
    role: "technician",
    technician_id: "a1000000-0000-0000-0000-000000000003",
    created_at: "",
  },
  {
    id: "c1000000-0000-0000-0000-000000000005",
    name: "Yusoff",
    email: "yusoff@sejuksejuk.com",
    role: "technician",
    technician_id: "a1000000-0000-0000-0000-000000000004",
    created_at: "",
  },
  {
    id: "c1000000-0000-0000-0000-000000000006",
    name: "Encik Razak (Manager)",
    email: "razak@sejuksejuk.com",
    role: "manager",
    technician_id: null,
    created_at: "",
  },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]);

  function switchUser(userId: string) {
    const user = SEED_USERS.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  }

  const value: AuthContextType = {
    currentUser,
    switchUser,
    isAdmin: currentUser.role === "admin",
    isTechnician: currentUser.role === "technician",
    isManager: currentUser.role === "manager",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { SEED_USERS };
