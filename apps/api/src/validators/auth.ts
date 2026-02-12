import { z } from 'zod'

/**
 * Signup validation schema
 */
export const signupSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
})

export type SignupInput = z.infer<typeof signupSchema>

/**
 * Signin validation schema
 */
export const signinSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Password is required'),
})

export type SigninInput = z.infer<typeof signinSchema>
