// Contrato del modelo User
export class User{
  constructor(
    public readonly id: string,
    public email: string,
    public password: string,
    public createdAt: Date

  )
  {
    if(!email.includes('@')){
      throw new Error('Formato de email incorrecto');
    }
  }  
}
