import { type Request, type Response, type NextFunction } from "express";
import { CreateUserCase } from "../../application/use-cases/CreateUserUseCase";
import { requireObjectBody, requireEmail, requirePassword } from "../validation/validators";

// Controlador de user donde aplicamos la creación de un usuario
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserCase) {}
  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Validation happens at the transport boundary, before the use case, so malformed
    // input is rejected as 4XX instead of travelling into the domain or the database.
    const body = requireObjectBody(req.body);
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);

    // Errors are forwarded to the global handler rather than caught and flattened to 500.
    const newUser = await this.createUserUseCase.execute({ email, password }).catch(next);
    if (newUser) {
      res.status(201).json(newUser);
    }
  };
}
