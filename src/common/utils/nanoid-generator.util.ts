import { customAlphabet } from "nanoid";

export const generateNanoId = (size: number = 6) => {
    return customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", size)();
};
