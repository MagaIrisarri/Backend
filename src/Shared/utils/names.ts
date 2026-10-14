// Nombres que carga una persona (marcas, modelos, tipos de vehículo): se guardan sin espacios de más
// y se comparan sin mayúsculas ni tildes ("Camión" y "CAMION " son el mismo).
export const cleanName = (s: string) => s.replace(/\s+/g, ' ').trim();
export const nameKey = (s: string) => cleanName(s).normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
// Descripciones del DNRPA y nombres de tipo al compararlos entre sí: además, sin guiones, puntos ni espacios
// ("Pick-up", "PICKUP" y "PICK UP" son lo mismo).
export const descKey = (s: string) => nameKey(s).replace(/[^A-Z0-9]/g, '');
