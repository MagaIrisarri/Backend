import { UserType } from '../constants/status.js';

// Personal de una cochera: un empleado de esa sucursal o su dueño. Única fuente: ReservationService y la pertenencia de las rutas (auth.ts).
export const isStaffOf = (
  user: { id: string; type: string; parkingId?: string } | null | undefined,
  parking: { id: string; owner?: { id: string } } | null | undefined,
): boolean => !!user && !!parking && (
  (user.type === UserType.EMPLEADO && user.parkingId === parking.id) ||
  (user.type === UserType.DUENO && parking.owner?.id === user.id)
);
