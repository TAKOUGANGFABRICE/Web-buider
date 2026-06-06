import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const RegisterSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(8),
})

export const WebsiteCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  template_id: z.string().uuid().optional(),
})

