/** Direct WhatsApp links to the agency with a prefilled message. */
export const waHref = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

/** Message sent from a recommended destination card. */
export const destinationMessage = (name: string) => `Hola!! estoy interesado en ${name}`;
