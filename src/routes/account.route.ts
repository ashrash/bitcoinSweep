
import { Router } from 'express';
import AccountController from '../controllers/account.controller';
import { Routes } from '../interfaces/routes.interface';
import validationMiddleware from '../middleware/validation.middleware';
import { CreateAccountDto } from '../dtos/account.dto';

class AccountRoute implements Routes {
  public route = '/account';
  public router = Router();
  public accountController = new AccountController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.route}/:_id`, this.accountController.getAccountById);
    this.router.post(`${this.route}`,  validationMiddleware(CreateAccountDto, 'body'), this.accountController.createAccount);
  }
}

export default AccountRoute;
