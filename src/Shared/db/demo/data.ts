// Formato de los JSON de la demo (demo/data/*.json). Lo escribe generate.ts y lo lee load.ts.
// Las fechas son días relativos al ancla (meta.anchor) y las horas, "HH:MM" locales.
import type { VehicleCategory } from '../../utils/vehicleTypes.js';

export type Person = { email: string; dni: string; name: string; last_name: string; birth: string; phone: string };
export type DemoUsers = {
  admin: Person;
  owners: (Person & { holidays?: { day: number; name: string }[] })[];
  clients: Person[];
};

export type DemoParking = {
  name: string; owner: string; province: string; locality: string; neighborhood: string; postalCode: string; address: string;
  latitude: number; longitude: number; openingTime: string; closingTime: string;
  minReservationHours: number; maxReservationHours: number; reservationMargin: number; isActive: boolean; imageUrl: string;
  spaces: Record<VehicleCategory, number>;
  maintenance: string[]; // códigos de plaza en mantenimiento
  prices: { type: VehicleCategory; price: number; from: number; to: number | null }[]; // `to`: día en que vence (null: vigente)
  services: { name: string; price: number }[];
  closedOn: number[]; // días de feriado a los que se adhiere (cierra)
  exceptions: { day: number; shifts: { employee: string; from: string; to: string }[]; closures: { from: string; to: string }[] }[];
};

export type DemoStaff = Person & { parking: string; shifts: { days: string[]; from: string; to: string }[] };

export type DemoVehicle = {
  plate: string; client: string; brand: string; model: string; type: VehicleCategory; color: string; year: number;
  insurance: string | null; since: number; // día de alta
};

// Qué pasa con la reserva; el estado lo calcula load.ts según la hora de carga.
//  done: llega (arrive min desde el inicio) y sale (exit min desde el fin reservado, + extra horas); paga con `pay`.
//  overstay: llega y sigue adentro aunque pasó el fin (R-21). cancel: el cliente cancela `cancelLead` min antes del inicio.
//  noshow: no llega y vence a los 15 min (R-17).
export type Outcome = 'done' | 'overstay' | 'cancel' | 'noshow';
export type DemoReservation = {
  parking: string; space: string; plate: string; day: number; start: string; hours: number; outcome: Outcome;
  lead: number; // minutos entre el alta y el inicio (0: mostrador)
  arrive?: number; exit?: number; extra?: number; pay?: string; unpaid?: boolean; rating?: number;
  services?: string[]; walkIn?: boolean; cancelLead?: number; assigned?: boolean;
};

export type DemoServiceCatalog = { name: string; description: string }[];

export type DemoMeta = { anchor: string; seed: number; from: number; to: number; counts: Record<string, number> };
