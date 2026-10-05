import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey } from '../api-key.js';

describe('api-key', ()=>{
    it('hashes the same key to the same value', ()=>{
        expect(hashApiKey('test')).toBe(hashApiKey('test'));
    });
    
    it('hashes different keys to different values', ()=>{
        expect(hashApiKey('test')).not.toBe(hashApiKey('different'));
    });

    it('generates distinct keys', ()=>{
        expect(generateApiKey()).not.toBe(generateApiKey());
    });
})
