/**
 * Centralized WhatsApp Configuration for COLORLINK & Pintuco
 */

// Default Colombian 10-digit mobile number prefixed with 57
export const DEFAULT_WHATSAPP_PHONE = '573000000000';

// Default prompt text requested by user
export const DEFAULT_WHATSAPP_MESSAGE = 'Hola, requiero asesoría sobre mi cotización en COLORLINK';

/**
 * Returns a standardized WhatsApp link
 */
export function getWhatsAppUrl(phone: string = DEFAULT_WHATSAPP_PHONE, customText?: string): string {
  // Clean phone number to digits only
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const finalPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
  const text = customText || DEFAULT_WHATSAPP_MESSAGE;
  return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Open WhatsApp directly in new window
 */
export function openWhatsAppDirect(phone: string = DEFAULT_WHATSAPP_PHONE, customText?: string): void {
  const url = getWhatsAppUrl(phone, customText);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}
