import { Repository } from "../Shared/base.Repository.js";
import { Reservation } from "./ReservationEntity.js";

export class ReservationService {
    constructor(private repo: Repository<Reservation>) { }

    findAll(): Reservation[] | undefined {
        return this.repo.findAll();
    }

    findOne(id: string): Reservation | undefined {
        return this.repo.findOne({ id });
    }

    create(input: Omit<Reservation, "id">): Reservation {
        const reservation = new Reservation(  
            input.startDate,
            input.endDate,
            input.locationID,
            input.status,
            input.vehicleID,
        );
        this.repo.add(reservation);
        return reservation;
    }

    update(id: string, input: Partial<Reservation>): Reservation | undefined {
        return this.repo.update({ id, ...input } as Reservation);
    }

    remove(id: string): { id: string } | undefined {
        return this.repo.remove({ id });
    }

    
}
