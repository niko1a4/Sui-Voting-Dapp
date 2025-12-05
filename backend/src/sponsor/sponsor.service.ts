import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EnokiClient } from '@mysten/enoki';

@Injectable()
export class SponsorService {
    private enokiClient: EnokiClient;

    constructor() {
        const apiKey = process.env.ENOKI_PRIVATE_API_KEY;

        if (!apiKey) {
            throw new Error('enoki priv key  not loaded properly');
        }

        this.enokiClient = new EnokiClient({
            apiKey: apiKey,
        });

    }

    async sponsorTransaction(transactionKindBytes: string, sender: string) {
        try {
            const sponsoredResponse = await this.enokiClient.createSponsoredTransaction({
                network: 'testnet',
                transactionKindBytes,
                sender,
                allowedAddresses: [sender],
                allowedMoveCallTargets: [
                    '0x994298cc21abfa191b0c90b87c9bef756ff69740726999f49d8e98d76cc092db::voting_dapp::vote'
                ],
            });

            return sponsoredResponse;
        } catch (error) {
            console.error('Error sponsoring transaction:', error);
            throw new HttpException(
                'Failed to sponsor transaction',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    async executeTransaction(digest: string, signature: string) {
        try {
            const result = await this.enokiClient.executeSponsoredTransaction({
                digest,
                signature,
            });

            return result;
        } catch (error) {
            console.error('Error executing transaction:', error);
            throw new HttpException(
                'Failed to execute transaction',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}