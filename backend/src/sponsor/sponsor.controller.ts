import { Controller, Post, Body } from '@nestjs/common';
import { SponsorService } from './sponsor.service';

@Controller('sponsor')
export class SponsorController {
    constructor(private readonly sponsorService: SponsorService) { }

    @Post('transaction')
    async sponsorTransaction(
        @Body() body: { transactionKindBytes: string; sender: string },
    ) {
        return this.sponsorService.sponsorTransaction(
            body.transactionKindBytes,
            body.sender,
        );
    }

    @Post('execute')
    async executeTransaction(
        @Body() body: { digest: string; signature: string },
    ) {
        return this.sponsorService.executeTransaction(body.digest, body.signature);
    }
}