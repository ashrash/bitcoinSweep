interface Tx {
    txid: string;
    output_no: number;
    script_asm: string;
    script_hex: string;
    value: string;
    confirmations: number;
    time: number;
}

interface Data {
    network: string;
    address: string;
    txs: Tx[];
}

export interface UnspentTx {
    status: string;
    data: Data;
}


    export interface Txref {
        tx_hash: string;
        block_height: number;
        tx_input_n: number;
        tx_output_n: number;
        value: number;
        ref_balance: number;
        spent: boolean;
        confirmations: number;
        confirmed: Date;
        double_spend: boolean;
        spent_by: string;
    }

    export interface Transact {
        address: string;
        total_received: number;
        total_sent: number;
        balance: number;
        unconfirmed_balance: number;
        final_balance: number;
        n_tx: number;
        unconfirmed_n_tx: number;
        final_n_tx: number;
        txrefs: Txref[];
        tx_url: string;
    }






export interface RootObject {
    block_hash: string;
    block_height: number;
    block_index: number;
    hash: string;
    hex: string;
    addresses: string[];
    total: number;
    fees: number;
    size: number;
    vsize: number;
    preference: string;
    relayed_by: string;
    confirmed: Date;
    received: Date;
    ver: number;
    double_spend: boolean;
    vin_sz: number;
    vout_sz: number;
    confirmations: number;
    confidence: number;
    inputs: any;
    outputs: any;
}




    export interface Status {
        confirmed: boolean;
        block_height: number;
        block_hash: string;
        block_time: number;
    }

    export interface UTXO {
        txid: string;
        vout: number;
        status: Status;
        value: number;
    }

