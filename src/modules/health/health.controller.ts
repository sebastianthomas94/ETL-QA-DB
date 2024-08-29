import { Controller, Get, VERSION_NEUTRAL } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { HealthCheckResDto } from "./dto/health-res.dto";

@ApiTags("health")
@Controller({
    version: VERSION_NEUTRAL,
    path: "health",
})
export class HealthController {
    @Get()
    @ApiOperation({ summary: "Check the health of application" })
    checkHealth(): HealthCheckResDto {
        return { status: "Ok", uptime: process.uptime() };
    }
}
