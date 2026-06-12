/*
  Warnings:

  - A unique constraint covering the columns `[sku]` on the table `Producto` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `producto` ADD COLUMN `proveedorId` INTEGER NULL,
    ADD COLUMN `sku` VARCHAR(191) NULL,
    ADD COLUMN `stockMinimo` INTEGER NOT NULL DEFAULT 5;

-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NULL,
    `rol` ENUM('ADMIN', 'MANAGER', 'USER') NOT NULL DEFAULT 'USER',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UsuarioTienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `tiendaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UsuarioTienda_usuarioId_tiendaId_key`(`usuarioId`, `tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Venta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroVenta` VARCHAR(191) NOT NULL,
    `cliente` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'EN_PROCESO', 'ENVIADA', 'ENTREGADA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    `total` DECIMAL(65, 30) NOT NULL,
    `subtotal` DECIMAL(65, 30) NOT NULL,
    `impuestos` DECIMAL(65, 30) NULL,
    `metodoPago` ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'DIGITAL') NULL,
    `tiendaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Venta_numeroVenta_key`(`numeroVenta`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `VentaItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precio` DECIMAL(65, 30) NOT NULL,
    `productoId` INTEGER NOT NULL,
    `ventaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MovimientoInventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipo` ENUM('ENTRADA', 'SALIDA', 'AJUSTE') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `productoId` INTEGER NOT NULL,
    `motivo` VARCHAR(191) NULL,
    `usuarioId` INTEGER NULL,
    `compraId` INTEGER NULL,
    `ventaId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proveedor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `contacto` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `ruc` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Proveedor_ruc_key`(`ruc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProveedorTienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `proveedorId` INTEGER NOT NULL,
    `tiendaId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProveedorTienda_proveedorId_tiendaId_key`(`proveedorId`, `tiendaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompraProveedor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroCompra` VARCHAR(191) NOT NULL,
    `proveedorId` INTEGER NOT NULL,
    `estado` ENUM('PENDIENTE', 'CONFIRMADA', 'EN_CAMINO', 'RECIBIDA', 'CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
    `total` DECIMAL(65, 30) NOT NULL,
    `subtotal` DECIMAL(65, 30) NOT NULL,
    `impuestos` DECIMAL(65, 30) NULL,
    `fechaEntrega` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CompraProveedor_numeroCompra_key`(`numeroCompra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CompraItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cantidad` INTEGER NOT NULL DEFAULT 1,
    `precio` DECIMAL(65, 30) NOT NULL,
    `productoId` INTEGER NOT NULL,
    `compraId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Producto_sku_key` ON `Producto`(`sku`);

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioTienda` ADD CONSTRAINT `UsuarioTienda_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UsuarioTienda` ADD CONSTRAINT `UsuarioTienda_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `Tienda`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Venta` ADD CONSTRAINT `Venta_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `Tienda`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VentaItem` ADD CONSTRAINT `VentaItem_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VentaItem` ADD CONSTRAINT `VentaItem_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `Venta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_compraId_fkey` FOREIGN KEY (`compraId`) REFERENCES `CompraProveedor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MovimientoInventario` ADD CONSTRAINT `MovimientoInventario_ventaId_fkey` FOREIGN KEY (`ventaId`) REFERENCES `Venta`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProveedorTienda` ADD CONSTRAINT `ProveedorTienda_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProveedorTienda` ADD CONSTRAINT `ProveedorTienda_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `Tienda`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompraProveedor` ADD CONSTRAINT `CompraProveedor_proveedorId_fkey` FOREIGN KEY (`proveedorId`) REFERENCES `Proveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompraItem` ADD CONSTRAINT `CompraItem_productoId_fkey` FOREIGN KEY (`productoId`) REFERENCES `Producto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CompraItem` ADD CONSTRAINT `CompraItem_compraId_fkey` FOREIGN KEY (`compraId`) REFERENCES `CompraProveedor`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
