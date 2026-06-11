import { z } from 'zod'

const emailConfig = z.object({
  email: z.string().email('Valid email is required'),
})

const webhookConfig = z.object({
  url: z.string().url('Valid webhook URL is required'),
  secret: z.string().optional(),
})

const slackConfig = z.object({
  webhookUrl: z.string().url('Valid Slack webhook URL is required'),
})

const discordConfig = z.object({
  webhookUrl: z.string().url('Valid Discord webhook URL is required'),
})

const configByType: Record<string, z.ZodTypeAny> = {
  email: emailConfig,
  webhook: webhookConfig,
  slack: slackConfig,
  discord: discordConfig,
}

const typeSchema = z.enum(['email', 'webhook', 'slack', 'discord'])

export const createAlertChannelSchema = z.object({
  type: typeSchema,
  config: z.any().refine((val) => typeof val === 'object' && val !== null, {
    message: 'Config must be a JSON object',
  }),
  enabled: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const validator = configByType[data.type]
  if (validator) {
    const result = validator.safeParse(data.config)
    if (!result.success) {
      result.error.issues.forEach(err => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['config', ...err.path],
          message: err.message,
        })
      })
    }
  }
})
