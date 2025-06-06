import { EnvironmentService } from "@common/global/environment.service";
import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validate } from "class-validator";

@Global()
@Module({
    imports: [ConfigModule.forRoot({ validate })],
    providers: [EnvironmentService],
    exports: [EnvironmentService],
})
export class GlobalModule {}
