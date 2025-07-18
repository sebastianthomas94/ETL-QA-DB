import { Module } from "@nestjs/common";
import { LoadService } from "./load.service";
import { AssetsLoadService } from "./services/assets-load.service";
import { GlobalModule } from "../../common/global/global.module";

@Module({
    imports: [GlobalModule],
    providers: [LoadService, AssetsLoadService],
    exports: [LoadService, AssetsLoadService],
})
export class LoadModule {}
