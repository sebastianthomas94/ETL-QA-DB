import { Module } from "@nestjs/common";
import { ExtractService } from "./services/extract.service";

@Module({
    imports: [],
    controllers: [],
    providers: [ExtractService],
    exports: [ExtractService],
})
export class ExtractModule {}
