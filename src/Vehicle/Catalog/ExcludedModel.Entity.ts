import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";

// L-33: modelo del CSV del DNRPA que el administrador destildó en la vista previa. Las importaciones siguientes lo omiten
// hasta que lo vuelve a admitir desde la pestaña "Actualizar con CSV".
@Entity()
export class ExcludedModel {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  // `${nameKey(marca)}|${nameKey(modelo)}`, la misma clave con que la importación compara.
  @Property({ type: 'string', unique: true })
  modelKey!: string;

  @Property({ type: 'string' })
  brand!: string;

  @Property({ type: 'string' })
  model!: string;

  @Property({ type: 'datetime' })
  createdAt: Date = new Date();
}
