import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class EnvironmentService {
    constructor(private configService: ConfigService) {}

    get NODE_ENV() {
        return this.configService.get("NODE_ENV");
    }

    get PORT() {
        return this.configService.get("PORT");
    }
}
