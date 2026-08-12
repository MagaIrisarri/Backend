export interface CreateParkingDto {
  locality: string;
  postalCode: string;
  address: string;
  carCapacity: number;
  motorcycleCapacity: number;
}

export interface ParkingIdDto {
  id: string;
}

export interface UpdateParkingDto 
  extends Partial<CreateParkingDto> {}