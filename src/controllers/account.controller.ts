import { AccountInfo } from '../interfaces/account.interface';
import { NextFunction, Request, Response } from 'express';
import AccountService from '../services/account.service';
import { BalanceInfo } from '../interfaces/balance.interface';
import { nullCheck } from '../utils/ramda';
class AccountController {
     accountService = new AccountService();
     
    public sweepAccountBalance = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.params;
            const { sweepSuccess, message } = await this.accountService.sweepAccount(_id);
            if(sweepSuccess) {
                res.status(200).json({  status: 200, sweepSuccess, message });
            }
            res.status(400).json({  status: 400, sweepSuccess, message });
        } catch (error) {
            next(error);
        }
    }
    public getAccountBalance = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { _id } = req.params;
            const balanceData: BalanceInfo | null = await this.accountService.accountBalanceById(_id);
            if(!nullCheck(balanceData)) {
                res.status(200).json({ data: balanceData, status: 200 });
            }
            res.sendStatus(204);
        } catch (error) {
            next(error);
        }
    }
    public createAccount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.body;
            const accountData: AccountInfo = await this.accountService.createAccount(username);
            if(!nullCheck(accountData)) {
                res.status(200).json({ data: accountData, status: 200 });
            }
            res.sendStatus(400);
        } catch (error) {
            next(error);
        }
    }

}

export default AccountController;
