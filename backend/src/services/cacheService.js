class CacheService{
    constructor() {
        this.cache= new Map();
        this.expirations=new Map();
        console.log('CacheService initialized');
    }
    
    set(key, value, ttl=3600) {
        this.cache.set(key, value);
        const expirationTime = Date.now()+(ttl * 1000);// Convert seconds to milliseconds
        this.expirations.set(key, expirationTime);

        setTimeout(()=>{
            this.delete(key);
            console.log(`Cache expired for key: ${key}`);
        }, ttl * 1000);

        console.log(`Cache set for key: ${key} with TTL: ${ttl}s`);
        return true;
    }
    

    get(key) {
        /*checks if there is a key in the cache */
        if (!this.cache.has(key)) {
            console.log(`Cache miss for key: ${key}`);
            return null;
        }   
        /*checks if the key has expired */
        const expirationTime=this.expirations.get(key);
        if(expirationTime && Date.now() > expirationTime){
            console.log(`Cache expired for key: ${key}`);
            this.delete(key);
            return null;
        }
        /*returns the cached value if it exists and has not expired */
        console.log(`Cache hit for key: ${key}`);
        return this.cache.get(key);
    }

    has(key) {
        if(!this.cache.has(key)){
            console.log(`Cache does not have key: ${key}`);
            return false;
        }
        /*checks if the key has expired */
        const expirationTime=this.expirations.get(key);
        if(expirationTime && Date.now() > expirationTime){
            console.log(`Cache expired for key: ${key}`);
            this.delete(key);
            return false;
        }
        return true;
    }

    delete(key) {
        this.cache.delete(key);
        this.expirations.delete(key);
        console.log(`Cache deleted for key: ${key}`);
        return true;        
    }

    clearUserCache(userId){
        let deletedCount=0
        for(const key of this.cache.keys()){
            if(key.startsWith(`user:${userId}:`)){
                this.delete(key);
                deletedCount++;     
            }
        }
        console.log(`Cleared ${deletedCount} cache entries for user: ${userId}`);
        return deletedCount;
    }

    clearAll(){
        const size=this.cache.size;
        this.cache.clear();
        this.expirations.clear();
        console.log(`Cleared all cache entries. Total cleared: ${size}`);
        return true;
    }

    getStats(){
        const start={
            totalKeys: this.cache.size,
            key: Array.from(this.cache.keys()),
        };
        console.log('Cache stats:', start);
        return start;
    }

    getTTL(key){
        if(!this.has(key)){
            return -1;
        }
        const expirationTime=this.expirations.get(key);
        if(!expirationTime){
            return -1;
        }
        const remainingMs=Math.floor((expirationTime -Date.now())/1000);
        console.log(`TTL for key ${key}: ${remainingMs}s`);
        return remainingMs;
    }
}

const cacheService= new CacheService();
export default cacheService;