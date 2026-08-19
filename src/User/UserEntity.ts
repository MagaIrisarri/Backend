import crypto from "node:crypto"

export class User {
  constructor(
  public dni: number,
  public last_name: string,
  public name: string,
  public date_of_brthdate: Date,
  public email: string,
  public phone: string,
  public password: string,
  public file: string,
  public type: string,
  public status: string,
  public ownerId?: string,
  public id = crypto.randomUUID(),

) {}
}