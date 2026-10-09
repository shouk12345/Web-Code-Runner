type Decision = {allowed: true} | {allowed: false; retryAfterSeconds: number};

class FixedWindowRateLimiter {
    private readonly buckets = new Map<string, {count: number; windowStart: number}>();
    constructor(
        private readonly limit: number,
        private readonly windowMs: number,
        private readonly now: ()=>number = Date.now,
        private readonly maxBuckets = 100_000,
    ){}

    check(key: string) : Decision {
        const t = this.now();
        const b = this.buckets.get(key);

        if(!b || t - b.windowStart >= this.windowMs){
            this.evictFull();
            this.buckets.set(key, {count: 1, windowStart: t});
            return {allowed: true};
        }

        if(b.count < this.limit){
            b.count += 1;
            return {allowed: true};
        }

        return {allowed: false, retryAfterSeconds: Math.ceil((b.windowStart + this.windowMs - t)/ 1000)};

    }

    private evictFull() : void {
        if(this.buckets.size < this.maxBuckets) return;
        const t = this.now();
        for(const [k,b] of this.buckets){
            if(t - b.windowStart >= this.windowMs) this.buckets.delete(k);
        }
        if(this.buckets.size >= this.maxBuckets){
            const oldest = this.buckets.keys().next().value;
            if(oldest !== undefined) this.buckets.delete(oldest);
        }
    }
}

export {FixedWindowRateLimiter, type Decision};