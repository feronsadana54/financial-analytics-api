import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "Jane Doe" })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: "jane@financial.local" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongPass123" })
  @IsString()
  @MinLength(6)
  password: string;
}
