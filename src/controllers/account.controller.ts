import { NextFunction, Request, Response } from 'express';
import AccountService from '@/services/account.service';

class AccountController {
     accountService = new AccountService();

    public getAccountById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.status(200).json({ data: new Date() });
        } catch (error) {
            next(error);
        }
    };

    public createAccount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name } = req.body;
            this.accountService.createAccount(name);
            res.status(200).json({ data: new Date() });
        } catch (error) {
            next(error);
        }
    }

}

export default AccountController;
