import { type Request, type Response } from "express";
import { CreateUserCase } from "../../application/use-cases/CreateUserUseCase";

// Controlador de user donde aplicamos la creación de un usuario
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserCase) {}
  public createUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const {email, password} = req.body
      const newUser = await this.createUserUseCase.execute({email, password})
      res.status(201).json(newUser)
    } catch (error){
      console.error(error)
      res.status(500).json({error: 'Error interno del servidor al crear el usuario' });
    }
  };
}
