import crypto from "node:crypto"

export class Reservation {
    constructor(
        public startDate: Date,    
        public endDate: Date,      
        public locationID: string,   
        public status: string, 
        public vehicleID: string,    
        public id = crypto.randomUUID()
    ) { }
}