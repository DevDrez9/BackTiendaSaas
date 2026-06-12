import { EstadoCompra } from "src/common/estado-compra.enum";

export class EstadoCompraMapper {
  static toPrisma(estado: EstadoCompra): string {
    return estado.toString();
  }

  static fromPrisma(estado: string): EstadoCompra {
    return estado as EstadoCompra;
  }
}

