import { HttpException, HttpStatus } from "@nestjs/common";
import { existsSync, mkdirSync } from "fs";
import { nanoid } from "nanoid";
import { diskStorage } from "multer";

export const multerConfig = {
    size: 1024 * 1024 * 5,
};

const dest: Record<string, string> = {
    main: "./assets",
};

type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;
type FileCreateCallBack = (error: Error | null, destination: string) => void;

// Multer upload options
export const multerOptions = () => {
    return {
        // Enable file size limits
        limits: {
            fileSize: multerConfig.size,
        },

        fileFilter: (req: unknown, file: Express.Multer.File, cb: FileFilterCallback) => {
            if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                cb(null, true);
            } else {
                cb(new HttpException(`Unsupported file type ${file.originalname}`, HttpStatus.BAD_REQUEST), false);
            }
        },

        storage: diskStorage({
            destination: (req: unknown, file: unknown, cb: FileCreateCallBack) => {
                const uploadPath = dest[dest.main];
                if (!existsSync(uploadPath)) {
                    mkdirSync(uploadPath);
                }
                cb(null, uploadPath);
            },
            filename: (req: unknown, file: Express.Multer.File, cb: FileCreateCallBack) => {
                cb(null, `${nanoid(6)}_${Date.now()}${file.mimetype.replace("image/", ".")}`);
            },
        }),
    };
};
