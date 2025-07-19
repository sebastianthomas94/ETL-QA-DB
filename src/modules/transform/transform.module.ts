import { Module } from "@nestjs/common";
import { TransformService } from "./transform.service";

@Module({
    imports: [],
    controllers: [],
    providers: [TransformService],
    exports: [TransformService],
})
export class TransformModule {}
