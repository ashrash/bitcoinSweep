import * as bip39 from 'bip39';
import fetch from 'node-fetch';
import BIP32Factory from 'bip32'
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import bigDecimal from 'js-big-decimal';
import { networks, payments, Psbt } from 'bitcoinjs-lib';
import { logger } from '../utils/logger';
import { nullCheck } from '../utils/ramda';
import { HttpException } from '../utils/exception';
import accountModel from '../models/account.models';
import { BalanceInfo } from '../interfaces/balance.interface';
import { UTXO } from '../interfaces/transaction.interface';
import { Account, AccountInfo, AccountPayload, Response } from '../interfaces/account.interface';


const ECPair = ECPairFactory(ecc);

const validator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer,
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

class AccountService {
    private account = accountModel;
    private bip32; 
    private network;
    private path: string;
    private tx;

    constructor() {
      this.bip32 = BIP32Factory(ecc);
      this.network = networks.testnet;
      this.path = `m/49'/0'/0'/0`;
      this.tx= new Psbt({ network: this.network });
    }


    public async getTransactionFee(inputCount) {
      const feeResponse =  await fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended',
      { method: 'GET' });
      const recommendedFee = await feeResponse.json();

      const transactionSize = inputCount * 180 + 2 * 34 + 10 - inputCount;
      const fee = bigDecimal.multiply(transactionSize , bigDecimal.divide(recommendedFee.hourFee, 3, 0));// satoshi per byte
      return fee;
    }

    public async getHexDataFromTxId(txid: string): Promise<string> {
      const response =  await fetch(`https://mempool.space/testnet/api/tx/${txid}/hex`,
      { method: 'GET' });
      const hexData: string = await response.text();
      return hexData;
    }

    public async fetchUnspentTransactions(sourceAddress: string, privateKey: string): Promise<UTXO[]> {
      const response =  await fetch(`https://mempool.space/testnet/api/address/${sourceAddress}/utxo`,
      { method: 'GET' });
      const unspentTx: UTXO[] = await response.json();
      return unspentTx;
    }

    public async getAccountData(_id: string): Promise<Account> {
      const accountResult: Account | null = await this.account.findById(_id);
      if (nullCheck(accountResult)) throw new HttpException(400, `Account: ${_id} does not exists`);
      return accountResult;
    }

    public async broadcastTransaction(txhex: string) {
      const boradcastResponse = await fetch('https://api.blockcypher.com/v1/btc/test3/txs/push', 
      { method: 'POST', body: JSON.stringify({ tx: txhex })});
      const data = await boradcastResponse.json();
      return data;
    }

    public async sweepAccount(_id: string): Promise<Response> {
      try {
        const currentAccount: Account | null = await this.getAccountData(_id);
        const { bitcoinAddress: sourceAddress, privateKey }: Account = currentAccount;

        const sender = ECPair.fromWIF(privateKey, this.network);
        const unspentTx: UTXO[] = await this.fetchUnspentTransactions(sourceAddress, privateKey);
        if(unspentTx.length === 0) {
            return { sweepSuccess: false, message: 'No Unspent transactions found' };
        }

        let consolidatedUTXOAmount = 0;
        let inputCount = 0;
        for (const element of unspentTx) {
          const { txid, value, vout } = element;
          const hexData:string = await this.getHexDataFromTxId(txid);
          consolidatedUTXOAmount += value;
          const input = {
            index: vout,
            hash: txid,
            nonWitnessUtxo: Buffer.from(hexData, 'hex'),
          };
          this.tx.addInput(input);
          inputCount += 1;
        }
        
        const fee = await this.getTransactionFee(inputCount);
        const sweepAmount  = bigDecimal.subtract(consolidatedUTXOAmount, fee); 
        if(parseFloat(sweepAmount) < 0) {
          return { sweepSuccess: false, message: 'Insufficient funds' };
        }

        this.tx.addOutput({
          address: '2NGML5duqYtd31oG7esBhWn8f9RzzaMxikY',  //Faucet Address
          value: parseFloat(sweepAmount),
        });

        for(let i=0;i<inputCount; i++){
          this.tx.signInput(i, sender);
        }
        this.tx.validateSignaturesOfInput(0, validator);
        this.tx.finalizeAllInputs();
        const txhex = this.tx.extractTransaction().toHex();

        const broadcastedTransaction = await this.broadcastTransaction(txhex);

        if(!nullCheck(broadcastedTransaction)) {
          logger.info(`Successfully swept account data to new address:  ${broadcastedTransaction}`)
          return { sweepSuccess: true, message: 'Successfully swept account data to new address' };
        }
        return { sweepSuccess: false, message: 'Sweep process broadcast failed' };
      } catch(e) {
        return { sweepSuccess: false, message: 'Something went wrong in sweep process' };
      }

    }


  public async accountBalanceById(_id: string): Promise<BalanceInfo | null> {
    try {
      const accountResult: Account | null = await this.getAccountData(_id);
      const { bitcoinAddress }: Account = accountResult;
      const response =  await fetch(`https://mempool.space/testnet/api/address/${bitcoinAddress}/utxo`,
      { method: 'GET' });
      const unspentTx: UTXO[] = await response.json();    
      const balanceInSatoshi = unspentTx.reduce((acc, curr) => {
        const { value }: UTXO = curr;
        return acc + value;
      }, 0);
      const balanceInBTC = balanceInSatoshi * 0.000000010;
      const balanceInfo: BalanceInfo = {
        balanceInBTC,
        balanceInSatoshi,
        address: bitcoinAddress,
      }
      return balanceInfo;
    } catch(e) {
      logger.error(`Error occured at service : accountBalanceById : ${JSON.stringify(e)}`);
      return null;
    }
  }

  public async createAccount(username: string): Promise<AccountInfo | null> {
    try {
      const accountResult: Account | null = await this.account.findOne({ username: username });
      if (accountResult) throw new HttpException(400, `User: ${username} already exists`);
  
      const mnemonic = bip39.generateMnemonic();
      const seed = bip39.mnemonicToSeedSync(mnemonic);
      const root = this.bip32.fromSeed(seed, this.network);
      const account = root.derivePath(this.path);
      const node = account.derive(0).derive(0);
  
      const bitcoinAddress = payments.p2pkh({
          pubkey: node.publicKey,
          network: this.network,
      }).address
  
      const payload: AccountPayload = {
          username,
          bitcoinAddress,
          privateKey: node.toWIF(),
      };
  
      const result: Account = await this.account.create(payload);
      const { _id } = result;
      const createdAccountData: AccountInfo = {
          _id,
          username,
          privateKey: node.toWIF(),
          mnemonic,
          bitcoinAddress,
          balance: 0,
      }
      return createdAccountData;
    } catch(e) {
      logger.error(`Error occured at service : createAccount : ${JSON.stringify(e)}`);
      return null;
    }
    
  }

}

export default AccountService;
