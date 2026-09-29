import {type Request, type Response, type NextFunction} from 'express'
import { LoginUseCase } from "../../application/use-cases/LoginUseCase";
import { requireObjectBody, requireEmail, requirePassword } from '../validation/validators'

export class LoginController {
  constructor(private readonly loginUseCase: LoginUseCase){}
  public loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const body = requireObjectBody(req.body);
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);

    // Bad credentials surface as a 401 via UnauthorizedError. Genuine server faults are
    // no longer flattened into 401, so an outage is distinguishable from a typo.
    const token = await this.loginUseCase.execute({email, password}).catch(next);
    if (token) {
      res.status(200).json({token});
    }
  };
}
