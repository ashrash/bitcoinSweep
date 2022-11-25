import { HttpException } from '../utils/exception';
import accountModel from '@/models/account.models';
import { Account, AccountInfo, AccountPayload } from '@/interfaces/account.interface';
import bip39 from 'bip39'
import bitcoin from 'bitcoinjs-lib'
import ecc from 'tiny-secp256k1'
import { BIP32Factory } from 'bip32'


// You must wrap a tiny-secp256k1 compatible implementation

class AccountService {
    private account = accountModel;
    private bip32 = BIP32Factory(ecc);
    network = bitcoin.networks.testnet;
    path = `m/49'/0'/0'/0` 

//   public async findUserDataById(userId: string): Promise<UserData> {
//     if (nullCheck(userId)) throw new HttpException(400, "User Id is undefined");

//     const userResult: UserData | null = await this.users.findOne({ _id: userId }).populate('hobbies');
//     if (!userResult) throw new HttpException(204, '');

//     return userResult;
//   }

//   public async findUserById(userId: string): Promise<User> {
//     if (nullCheck(userId)) throw new HttpException(400, "User Id is undefined");

//     const userResult: User | null = await this.users.findOne({ _id: userId });
//     if (!userResult) throw new HttpException(204, '');

//     return userResult;
//   }

  public async createAccount(name: string): Promise<Account| null> {
    const accountResult: Account | null = await this.account.findOne({ name: name });
    if (accountResult) throw new HttpException(400, `User: ${name} already exists`);

    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const root = this.bip32.fromSeed(seed, this.network);

    const account = root.derivePath(this.path);
    const node = account.derive(0).derive(0);

    const bitcoinAddress = bitcoin.payments.p2pkh({
        pubkey: node.publicKey,
        network: this.network,
    }).address

    const payload: AccountPayload = {
        name,
        bitcoinAddress,
    };

    const result: Account = await this.account.create(payload);
    const { _id } = result;
    const createdAccountData: AccountInfo = {
        _id,
        name,
        privateKey: node.toWIF(),
        mnemonic,
        bitcoinAddress,
        balance: 0,
    }

    

    return createdAccountData;
  }

}

export default AccountService;
