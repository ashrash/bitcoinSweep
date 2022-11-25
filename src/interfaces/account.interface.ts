
export interface Account {
    _id: number;
    name: string;
    bitcoinAddress: string;
}

export interface AccountInfo extends Account {
    balance: number;
    mnemonic: string;
    privateKey: string;
}

export interface AccountPayload extends Omit<Account, "_id"> {

}