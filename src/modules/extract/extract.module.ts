import { Module } from "@nestjs/common";
import { ExtractService } from "./extract.service";
import { ExtractController } from "./extract.controller";
import { GlobalModule } from "../../common/global/global.module";

@Module({
    imports: [GlobalModule],
    controllers: [ExtractController],
    providers: [ExtractService],
    exports: [ExtractService],
})
export class ExtractModule {}
