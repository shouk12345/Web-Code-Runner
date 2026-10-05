interface ApiKeyRecord{
    keyId: string; // Unique identifier for the key
    KeyHash: string; // SHA256 hash of the key
}

interface AuthStore {
    findByKeyHash(hash: string): Promise<ApiKeyRecord | null>;
}

export{type AuthStore, type ApiKeyRecord};