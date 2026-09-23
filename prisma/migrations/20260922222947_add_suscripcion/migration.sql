-- DropForeignKey
ALTER TABLE `producto` DROP FOREIGN KEY `Producto_categoriaId_fkey`;

-- DropIndex
DROP INDEX `Producto_categoriaId_fkey` ON `producto`;

-- AlterTable
ALTER TABLE `configweb` ADD COLUMN `whatsapp` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `movimientoinventario` ADD COLUMN `stockAnterior` INTEGER NULL,
    ADD COLUMN `stockNuevo` INTEGER NULL;

-- AlterTable
ALTER TABLE `producto` MODIFY `categoriaId` INTEGER NULL;

-- AlterTable
ALTER TABLE `tienda` ADD COLUMN `ciudad` VARCHAR(191) NULL,
    ADD COLUMN `limiteProductosPersonalizado` INTEGER NULL,
    ADD COLUMN `planId` INTEGER NULL,
    ADD COLUMN `suscripcionFin` DATETIME(3) NULL,
    ADD COLUMN `suscripcionInicio` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `Plan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `nivel` INTEGER NOT NULL,
    `limiteProductos` INTEGER NOT NULL DEFAULT 20,
    `limiteImagenesPorProducto` INTEGER NOT NULL DEFAULT 1,
    `precioMensual` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Plan_nombre_key`(`nombre`),
    UNIQUE INDEX `Plan_nivel_key`(`nivel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PagoSuscripcion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tiendaId` INTEGER NOT NULL,
    `planId` INTEGER NOT NULL,
    `meses` INTEGER NOT NULL,
    `monto` DECIMAL(65, 30) NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `bankQrId` VARCHAR(191) NULL,
    `estado` ENUM('PENDIENTE', 'PAGADO', 'EXPIRADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `qrImageBase64` TEXT NULL,
    `expiraEn` DATETIME(3) NULL,
    `pagadoEn` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PagoSuscripcion_idempotencyKey_key`(`idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Tienda` ADD CONSTRAINT `Tienda_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Producto` ADD CONSTRAINT `Producto_categoriaId_fkey` FOREIGN KEY (`categoriaId`) REFERENCES `Categoria`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoSuscripcion` ADD CONSTRAINT `PagoSuscripcion_tiendaId_fkey` FOREIGN KEY (`tiendaId`) REFERENCES `Tienda`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PagoSuscripcion` ADD CONSTRAINT `PagoSuscripcion_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
