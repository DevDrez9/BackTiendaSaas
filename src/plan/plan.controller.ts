import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { PlanService } from './plan.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from '@prisma/client';


// Opcional: Implementar un Guard de autenticación y rol para restringir el acceso solo a ADMIN
// @UseGuards(AuthGuard, RolesGuard)
// @Roles('ADMIN')
@Controller('planes')
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPlanDto: CreatePlanDto): Promise<Plan> {
    return this.planService.create(createPlanDto);
  }

  @Get()
  findAll(): Promise<Plan[]> {
    return this.planService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Plan> {
    return this.planService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<Plan> {
    return this.planService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) 
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
   
    await this.planService.remove(id); 
  }
}
