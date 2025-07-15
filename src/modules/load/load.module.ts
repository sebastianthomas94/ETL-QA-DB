import { Module } from "@nestjs/common";
import { LoadService } from "./load.service";
import { GlobalModule } from "../../common/global/global.module";

@Module({
    imports: [GlobalModule],
    providers: [LoadService],
    exports: [LoadService],
})
export class LoadModule {}
