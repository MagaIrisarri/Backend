import { Repository } from "../Shared/base.Repository.js";
import { Reservation } from "./ReservationEntity.js";


const reservations: Reservation[] = []; // En memoria (reemplazar con BD)

export class ReservationRepository implements Repository<Reservation> {

    public findAll(): Reservation[] | undefined {
        return reservations;
    }

    public findOne(item: { id: string; }): Reservation | undefined {
        return reservations.find((reservation) => reservation.id === item.id);
    }

    public add(item: Reservation): Reservation | undefined {
        reservations.push(item);
        return item;
    }

    public update(item: Reservation):Reservation | undefined {
        const reservationIndex = reservations.findIndex(reservation => reservation.id === item.id);

        if (reservationIndex >= 0) {
            reservations[reservationIndex] = { ...reservations[reservationIndex], ...item }
        }

        return reservations[reservationIndex];
    }

    public remove(item: { id: string; }): { id: string } | undefined {
        const reservationIndex = reservations.findIndex((reservation) => reservation.id === item.id);

        if (reservationIndex >= 0) {
            reservations.splice(reservationIndex, 1);
            return { id: item.id }
        }
        else {
            return undefined;
        }

    }

}