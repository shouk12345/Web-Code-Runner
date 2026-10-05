import {generateApiKey, hashApiKey} from "../domain/api-key.js";
import type {ApiKeyRecord} from "../domain/auth-store.js";

const keyId = process.argv[2];
if(!keyId) {
    console.error('Usage: node dist/cli/issue-key.js <keyId>');
    process.exit(1);
}

const apiKey = generateApiKey();
const record: ApiKeyRecord = { keyId, KeyHash: hashApiKey(apiKey) };

console.log('API key (shown once, store it safely):');
console.log(apiKey);
console.log('Record:');
console.log(JSON.stringify(record));

