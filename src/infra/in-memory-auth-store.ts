import type { AuthStore, ApiKeyRecord } from "../domain/auth-store.js";

class InMemoryAuthStore implements AuthStore{
    private readonly records: Map<string, ApiKeyRecord>;

    constructor(records: ApiKeyRecord[] = []){
        this.records = new Map(records.map((r)=>[r.keyHash, r]));
    }

    async findByKeyHash(keyHash: string): Promise<ApiKeyRecord | null> {
        return this.records.get(keyHash) ?? null;
    }


}

export {InMemoryAuthStore};