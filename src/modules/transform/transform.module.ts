import { Module } from "@nestjs/common";
import { TransformService } from "./transform.service";

@Module({
    controllers: [],
    providers: [TransformService],
    exports: [TransformService],
})
export class TransformModule {}
