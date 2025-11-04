import { z } from 'zod';

/**
 * Campaign Form Validation Schema
 * 
 * SOTA Oct 2025: Zod for runtime type safety
 * Source: React Hook Form Best Practices 2025
 * https://react-hook-form.com/get-started#SchemaValidation
 * 
 * Security: OWASP Top 10 2025 - Input Validation
 * https://owasp.org/www-project-top-ten/
 */

export const campaignSchema = z.object({
  campaign_name: z.string()
    .trim()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .regex(/^[a-zA-Z0-9\s\-_àâäéèêëïîôöùûüçÀÂÄÉÈÊËÏÎÔÖÙÛÜÇ]+$/, "Caractères spéciaux non autorisés"),
  
  subject: z.string()
    .trim()
    .min(5, "Le sujet doit contenir au moins 5 caractères")
    .max(200, "Le sujet ne peut pas dépasser 200 caractères")
    .refine((val) => !val.includes('<script'), 'Le sujet ne peut pas contenir de code HTML'),
  
  content: z.string()
    .trim()
    .min(50, "Le contenu doit contenir au moins 50 caractères")
    .max(50000, "Le contenu ne peut pas dépasser 50000 caractères"),
  
  send_at: z.string()
    .datetime({ message: "Date invalide" })
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      const sendDate = new Date(val);
      const now = new Date();
      return sendDate > now;
    }, "La date d'envoi doit être dans le futur"),

  segment_id: z.string()
    .uuid({ message: "Segment ID invalide" })
    .optional()
    .nullable(),

  lifecycle_stage_id: z.string()
    .uuid({ message: "Lifecycle Stage ID invalide" })
    .optional()
    .nullable(),

  template_id: z.string()
    .uuid({ message: "Template ID invalide" })
    .optional()
    .nullable(),
});

export type CampaignFormData = z.infer<typeof campaignSchema>;

/**
 * Quick Campaign Schema (simplified for quick sends)
 */
export const quickCampaignSchema = campaignSchema.pick({
  campaign_name: true,
  subject: true,
  content: true,
});

export type QuickCampaignFormData = z.infer<typeof quickCampaignSchema>;
