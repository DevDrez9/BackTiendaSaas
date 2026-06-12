import { Injectable, NotFoundException } from '@nestjs/common';

import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PrismaService } from 'src/prisma.service';
import { Plan } from '@prisma/client';


@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  /**
   * Crea un nuevo plan en la base de datos.
   * @param createPlanDto Datos del nuevo plan.
   * @returns El plan creado.
   */
  async create(createPlanDto: CreatePlanDto): Promise<Plan> {
    return this.prisma.plan.create({
      data: {
        ...createPlanDto,
        // Prisma convierte automáticamente Number a Decimal para el precioMensual si se proporciona.
      },
    });
  }

  /**
   * Obtiene todos los planes.
   * @returns Lista de planes.
   */
  async findAll(): Promise<Plan[]> {
    return this.prisma.plan.findMany({
      orderBy: { nivel: 'asc' }, // Ordenar por nivel (1, 2, 3...)
    });
  }

  /**
   * Obtiene un plan por su ID.
   * @param id ID del plan.
   * @returns El plan encontrado.
   */
  async findOne(id: number): Promise<Plan> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException(`Plan con ID ${id} no encontrado.`);
    }
    return plan;
  }

  /**
   * Actualiza un plan existente.
   * @param id ID del plan a actualizar.
   * @param updatePlanDto Nuevos datos del plan.
   * @returns El plan actualizado.
   */
  async update(id: number, updatePlanDto: UpdatePlanDto): Promise<Plan> {
    try {
      return await this.prisma.plan.update({
        where: { id },
        data: updatePlanDto,
      });
    } catch (error) {
      // Manejar el caso de que el ID no exista o haya un conflicto (ej. nivel duplicado)
      if (error.code === 'P2025') {
        throw new NotFoundException(`Plan con ID ${id} no encontrado.`);
      }
      throw error;
    }
  }

  /**
   * Elimina un plan por su ID.
   * NOTA: Asegúrate de manejar las tiendas que podrían estar asignadas a este plan antes de eliminar.
   * @param id ID del plan a eliminar.
   * @returns El plan eliminado.
   */
  async remove(id: number): Promise<Plan> {
    try {
      // Considera primero desvincular las tiendas (tienda.planId = null) antes de la eliminación.
      return await this.prisma.plan.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Plan con ID ${id} no encontrado.`);
      }
      throw error;
    }
  }
}
