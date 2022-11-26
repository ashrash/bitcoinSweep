import { model, Schema } from 'mongoose';
import { Account } from '../interfaces/account.interface';

const accountSchema: Schema = new Schema({
  username: { type: String, unique: true, required: true },
  bitcoinAddress: { type: String, required: true},
  privateKey: { type: String, required: true},
});

const accountModel = model<Account>('Account', accountSchema);

export default accountModel;
