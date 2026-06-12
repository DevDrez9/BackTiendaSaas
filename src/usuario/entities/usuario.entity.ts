import { Rol } from "src/common/rol.enum";
import { Tienda } from "src/tienda/entities/tienda.entity";
import { UserStore } from "./user-store.entity";

// src/users/entities/user.entity.ts
export class User {
  id: number;
  email: string;
  password: string;
  nombre: string;
  apellido?: string;
  rol: Rol;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
  tiendas?: UserStore[];
 movimientosInventario?: MovimientoInventarioBasic[];
}

interface MovimientoInventarioBasic {
  id: number;
  tipo: string;
  cantidad: number;
  motivo?: string;
  createdAt: Date;
  producto?: {
    id: number;
    nombre: string;
  };
}
