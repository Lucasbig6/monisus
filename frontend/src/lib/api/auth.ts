import { api } from "./client";
import type { LoginResponse, User } from "../types";

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>("/api/auth/login", { username, password }),

  me: () => api.get<User>("/api/auth/me"),
};
