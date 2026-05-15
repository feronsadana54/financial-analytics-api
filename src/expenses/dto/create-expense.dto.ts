import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateExpenseDto {
  @ApiProperty()
  @IsString()
  expenseCategoryId: string;

  @ApiProperty()
  @IsDateString()
  expenseDate: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
