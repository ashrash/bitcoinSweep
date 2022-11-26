import { HttpException } from '../utils/exception';
import accountModel from '../models/account.models';
import { Account, AccountInfo, AccountPayload } from '../interfaces/account.interface';
import * as bip39 from 'bip39'
import { networks, payments, Psbt, crypto, script, Transaction } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import BIP32Factory from 'bip32'
import * as R from 'ramda';
import ECPairFactory from 'ecpair';
import { logger } from '../utils/logger';
import { nullCheck } from '../utils/ramda';
import fetch from 'node-fetch';
import { BalanceInfo } from '../interfaces/balance.interface';
import { RootObject, Transact, Txref } from '../interfaces/transaction.interface';

const ECPair = ECPairFactory(ecc);

const validator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer,
): boolean => ECPair.fromPublicKey(pubkey).verify(msghash, signature);

class AccountService {
    private account = accountModel;
    bip32 = BIP32Factory(ecc)
    network = networks.testnet;
    path = `m/49'/0'/0'/0` 

    public async sweepAccount(_id: string): Promise<boolean> {
      try {
        const accountResult: Account | null = await this.account.findById(_id);
        if (nullCheck(accountResult)) throw new HttpException(400, `Account: ${_id} does not exists`);
        //Get unspent tx

        const { bitcoinAddress: sourceAddress }: Account = accountResult;

        const sender = ECPair.fromWIF('cVg9UA6YE7VA9A8JE97RaFbArUKmD1GbJfbJG8xcutH6fG3hgtyW', this.network);

        const response =  await fetch(`https://api.blockcypher.com/v1/btc/test3/addrs/${sourceAddress}`,
        { method: 'GET' });
        const unspentTx: Transact = await response.json();
        const { txrefs }:Transact = unspentTx;
        const tx = new Psbt({ network: this.network});

        let totalAmountAvailable = 0;
        let inputCount = 0;

        const utxos = txrefs?.filter(({ spent }: Txref) => R.equals(spent, false));

        for (const element of utxos) {
          const { tx_hash, value } = element;
          const response =  await fetch(`https://api.blockcypher.com/v1/btc/test3/txs/${tx_hash}?includeHex=true`,
          { method: 'GET' });
          const txData: RootObject = await response.json();
          const { hex, hash, vout_sz }: RootObject = txData;
          totalAmountAvailable += value;

          tx.addInput({
            index: inputCount,
            hash,
            nonWitnessUtxo: Buffer.from(hex, 'hex'),
          });
          inputCount += 1;

        }
        
        const feeResponse =  await fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended',
        { method: 'GET' });
        const recommendedFee = await feeResponse.json();

        const transactionSize =
        inputCount * 180 + 2 * 34 + 10 - inputCount;

        const fee = transactionSize * recommendedFee.hourFee/3; // satoshi per byte

        tx.addOutput({
          address: '2NGML5duqYtd31oG7esBhWn8f9RzzaMxikY',
          value: totalAmountAvailable - fee,
        });

        for(let i=0;i<inputCount; i++) tx.signInput(i, sender);
        tx.validateSignaturesOfInput(0, validator);
        tx.finalizeAllInputs();
        console.log(tx.extractTransaction().toHex())
        return true;
      } catch(e) {
        return false;
      }

    }


  public async accountBalanceById(_id: string): Promise<BalanceInfo | null> {
    try {
      const accountResult: Account | null = await this.account.findById(_id);
      if (nullCheck(accountResult)) throw new HttpException(400, `Account: ${_id} does not exists`);
      const { bitcoinAddress }: Account = accountResult;
      const url =`https://sochain.com/api/v2/address/BTCTEST/${bitcoinAddress}/balance`;
      const response =  await fetch(url, { method: 'GET' });
      const balance: BalanceInfo = await response.json();
      return balance;
    } catch(e) {
      logger.error(`Error occured at service : createAccount : ${JSON.stringify(e)}`);
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
