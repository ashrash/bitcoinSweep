import { IsString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateAccountDto {
  @IsInt()
  @IsNotEmpty()
  public _id: Number;

  @IsString()
  @IsNotEmpty()
  public name: string;
}
