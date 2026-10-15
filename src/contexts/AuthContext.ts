import { createContext } from "react";
import type { AuthContextType } from "../types/Auth";

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);
