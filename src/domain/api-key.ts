import {createHash, randomBytes} from "node:crypto";

function generateApiKey(): string {
    return randomBytes(32).toString('base64url');
}

function hashApiKey(key: string) : string {
    return createHash('sha256').update(key).digest('base64url');
}

export {generateApiKey, hashApiKey};