import { Controller, Get, Post } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiFileUpload } from "@common/decorators/fileupload-api-decorator";

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getHello(): string {
        return this.appService.getHello();
    }

    @Post()
    @ApiFileUpload("file")
    postFileUpload() {
        return "File uploaded";
    }
}
