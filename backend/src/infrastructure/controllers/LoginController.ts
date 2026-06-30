import {type Request, type Response} from "express";
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";

export class LoginController {
  constructor(private readonly loginUseCase: LoginUseCase){}
  public loginUser = async (req: Request, res: Response): Promise<void> => {
    try{
      const {email, password} = req.body;
      const userLogin = await this.loginUseCase.execute({email, password});
      res.status(200).json({token: userLogin});
    } catch (error){
      console.error(error);
      res.status(401).json({error: 'Credenciales inválidas' });
    }
  };
}
