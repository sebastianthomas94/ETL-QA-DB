import { applyDecorators, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express/multer";
import { ApiBody, ApiConsumes } from "@nestjs/swagger";

export const FILE_UPLOAD_SWAGGER_CONFIG = {
    required: true,
    schema: {
        type: "object",
        properties: {
            file: {
                type: "string",
                format: "binary",
            },
        },
    },
};

// The name parameter is the name of the field in the form data
export function ApiFileUpload(name: string) {
    return applyDecorators(
        UseInterceptors(FileInterceptor(name)),
        ApiConsumes("multipart/form-data"),
        ApiBody(FILE_UPLOAD_SWAGGER_CONFIG),
    );
}
