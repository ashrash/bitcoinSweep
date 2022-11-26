import { AccountInfo } from '../interfaces/account.interface';
import { NextFunction, Request, Response } from 'express';
import AccountService from '../services/account.service';
import { BalanceInfo } from '../interfaces/balance.interface';
class AccountController {
     accountService = new AccountService();
     
    public sweepAccountBalance = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.params;
            const { sweepSuccess, message } = await this.accountService.sweepAccount(_id);
            res.status(200).json({  status: 200, sweepSuccess, message });
        } catch (error) {
            next(error);
        }
    }
    public getAccountBalance = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.params;
            const balanceData: BalanceInfo | null = await this.accountService.accountBalanceById(_id);
            res.status(200).json({ data: balanceData, status: 200 });
        } catch (error) {
            next(error);
        }
    }
    public createAccount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.body;
            const accountData: AccountInfo = await this.accountService.createAccount(username);
            res.status(200).json({ data: accountData, status: 200 });
        } catch (error) {
            next(error);
        }
    }

}

export default AccountController;
