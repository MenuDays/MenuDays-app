// Mismo criterio que buildWhatsAppNumber en
// services/restaurantApplicationsAdmin.service.ts (se separa acá para no
// importar un service de admin desde una pantalla de comensal). Cuando se
// conecte el back, capaz conviene mover ese helper de admin acá y que
// ambos usen este mismo archivo.

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleanPhone}${query}`;
}
