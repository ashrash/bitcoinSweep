
export interface Account {
    _id: number;
    username: string;
    bitcoinAddress: string;
    privateKey: string;
}

export interface AccountInfo extends Account {
    balance: number;
    mnemonic: string;
}

export interface AccountPayload extends Omit<Account, "_id"> {

}

export interface Response {
    sweepSuccess: boolean;
    message:  string;
}