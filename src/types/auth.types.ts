import type { JWTPayload } from "jose";
import type { NextRequest } from "next/server";
import type { z } from "zod";

import type { loginSchema } from "@/validations/auth.schema";

export interface TokenPayload extends JWTPayload {
  userId: string;
}

export interface AuthRequest extends NextRequest {
  userId: string;
}

export type LoginDto = z.infer<typeof loginSchema>;

export interface LoginResult {
  accessToken: string;
  expiresIn: string;
  user: {
    id: string;
    username: string;
    fullName: string;
  };
}
