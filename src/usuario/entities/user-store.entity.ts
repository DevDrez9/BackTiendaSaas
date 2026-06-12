import { Tienda } from "src/tienda/entities/tienda.entity";
import { User } from "./usuario.entity";

// src/users/entities/user-store.entity.ts
export class UserStore {
  id: number;
  usuarioId: number;
  tiendaId: number;
  createdAt: Date;
  updatedAt: Date;
  usuario?: User;
  tienda?: Tienda;
}
