// Nombres que carga una persona (marcas, modelos, tipos de vehículo): se guardan sin espacios de más
// y se comparan sin mayúsculas ni tildes ("Camión" y "CAMION " son el mismo).
export const cleanName = (s: string) => s.replace(/\s+/g, ' ').trim();
export const nameKey = (s: string) => cleanName(s).normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
