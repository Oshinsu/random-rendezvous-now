import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Campaign Form Validation Schema
 * 
 * SOTA Nov 2025: Zod for runtime type safety + DOMPurify for XSS prevention
 * Sources:
 * - React Hook Form Best Practices 2025: https://react-hook-form.com/get-started#SchemaValidation
 * - OWASP XSS Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 * - DOMPurify: https://github.com/cure53/DOMPurify
 * 
 * Security: OWASP Top 10 2025 - Input Validation + XSS Prevention
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
    .max(50000, "Le contenu ne peut pas dépasser 50000 caractères")
    .transform((html) => {
      // ✅ SOTA Nov 2025: XSS Prevention with DOMPurify
      // Source: OWASP XSS Prevention Cheat Sheet
      // https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
      return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'span', 'div'],
        ALLOWED_ATTR: ['href', 'target', 'style', 'class'],
        ALLOW_DATA_ATTR: false, // Prevent data-* attributes that could be exploited
        FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form'], // Explicit forbid dangerous tags
        FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'] // Prevent event handler attributes
      });
    }),
  
  send_at: z.string()
    .optional()
    .nullable()
    .refine((val) => {
      if (!val) return true;
      // ✅ SOTA Nov 2025: Validate ISO 8601 datetime format
      // Source: RFC 3339 (ISO 8601 subset)
      // https://datatracker.ietf.org/doc/html/rfc3339
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
      if (!iso8601Regex.test(val)) {
        return false;
      }
      const sendDate = new Date(val);
      // Check if date is valid (not NaN)
      if (isNaN(sendDate.getTime())) {
        return false;
      }
      const now = new Date();
      return sendDate > now;
    }, "La date d'envoi doit être dans le futur et au format ISO 8601"),

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
