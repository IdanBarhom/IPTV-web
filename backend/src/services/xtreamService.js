// import axios from 'axios';
// import {cacheService} from './cacheService';

// class XtreamService{
//     constructor(){
//         this.cacheTTl=3600;

//     }
//     buildURL(baseUrl, username, password, action, params={}){
//         let url = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=${action}`;
//         Object.keys(params.forEach(key =>{
//             url+=`&${key}=${params[key]}`;
//         }))
//         return url
//     }
//     getUserCacheKKey(baseUrl,username,password){
//             const credentials = Buffer.from(`${baseUrl}:${username}:${password}`).toString('base64');
//             return `user:${credentials}`;
//     }
//     async fetchAllUserData(baseUrl, username, password){
//         const cacheKey= this.getUserCacheKKey(baseUrl,username,password);

//         const cachedData=cacheService.get(cacheKey);
//         if(cachedData){
//             console.log('[Cache HIT] Returning cached Xtream data');
//             return cachedData;
//         }
//         console.log('[Cache MISS]Fetching Xtream data from API');
//         try{
//             const startTime=Date.now();
//             const [
//                 liveCategories,
//                 vodCategories,
//                 seriesCategories,
//                 liveStreams,
//                 vodStreams,
//                 series
//             ] = await Promise.all([
//                 this.fetchLiveCategories(baseUrl, username, password),
//                 this.fetchVODCategories(baseUrl, username, password),
//                 this.fetchSeriesCategories(baseUrl, username, password),
//                 this.fetchLiveStreams(baseUrl, username, password),
//                 this.fetchVODStreams(baseUrl, username, password),
//                 this.fetchSeries(baseUrl, username, password)
//             ]);
            
//             const fetchDuration=Date.now()-startTime;
//             console.log(`Fetched all Xtream data in ${fetchDuration}ms`);
//             const allData={
//                 categories: {
//                 live: liveCategories,
//                 vod: vodCategories,
//                 series: seriesCategories
//                 },
//                 streams: {
//                 live: liveStreams,
//                 vod: vodStreams,
//                 series: series
//                 },
//                 metadata: {
//                 fetchedAt: new Date().toISOString(),
//                 fetchDuration: `${fetchDuration}ms`,
//                 totalStreams: liveStreams.length + vodStreams.length + series.length,
//                 username: username,
//                 baseUrl: baseUrl
//                 }
//             };

//             /*savin to cache */
//             cacheService.set(cacheKey, allData, this.cacheTTl);
//             console.log('[Cache SET] Cached Xtream data');
//             return allData;
//         }
//         catch(error){
//             console.error('Error fetching Xtream data:', error.message);
//             throw error;
//         }
//     }

//     async getStreamsByCategory(baseUrl,username,password,categoryId,type='vod'){
//         const allData= await this.fetchAllUserData(baseUrl,username,password);
//         const streams= allData.streams[type] ||[];
//         if (!categoryId || categoryId ==='all'){
//             return streams;
//         }
//         return streams.filter(stream =>
//             stream.category_id === categoryId ||
//             stream.category_id === parseInt(categoryId)
//         );
        
//     }

//     async searchStreams(baseUrl, username, password, query, type = 'all') {
//     const allData = await this.fetchAllUserData(baseUrl, username, password);
//     const searchLower = query.toLowerCase();
//     let results = [];

//     if (type === 'all' || type === 'live') {
//       const liveResults = allData.streams.live.filter(stream =>
//         stream.name?.toLowerCase().includes(searchLower)
//       );
//       results = [...results, ...liveResults.map(s => ({ ...s, type: 'live' }))];
//     }

//     if (type === 'all' || type === 'vod') {
//       const vodResults = allData.streams.vod.filter(stream =>
//         stream.name?.toLowerCase().includes(searchLower)
//       );
//       results = [...results, ...vodResults.map(s => ({ ...s, type: 'vod' }))];
//     }

//     if (type === 'all' || type === 'series') {
//       const seriesResults = allData.streams.series.filter(stream =>
//         stream.name?.toLowerCase().includes(searchLower)
//       );
//       results = [...results, ...seriesResults.map(s => ({ ...s, type: 'series' }))];
//     }

//     return results;
//   }

//   async getAllCategories(baseUrl, username, password, type = null) {
//     const allData = await this.fetchAllUserData(baseUrl, username, password);

//     if (type && allData.categories[type]) {
//       return allData.categories[type];
//     }

//     return allData.categories;
//   }


//   async fetchLiveCategories(baseUrl, username, password) {
//     try {
//       const url = this.buildURL(baseUrl, username, password, 'get_live_categories');
//       const response = await axios.get(url, { timeout: 10000 });
//       return response.data || [];
//     } catch (error) {
//       console.error('Error fetching live categories:', error.message);
//       return [];
//     }
//   }
//   async getCacheInfo(baseUrl, username, password) {
//     const cacheKey = this.getUserCacheKey(baseUrl, username, password);
    
//     if (!cacheService.has(cacheKey)) {
//       return {
//         cached: false,
//         message: 'No cache found for this user'
//       };
//     }

//     const ttl = cacheService.getTTL(cacheKey);
//     const data = cacheService.get(cacheKey);

//     return {
//       cached: true,
//       ttlSeconds: ttl,
//       ttlFormatted: `${Math.floor(ttl / 60)} minutes ${ttl % 60} seconds`,
//       metadata: data?.metadata
//     };
//   }
// }

// const xtreamService = new XtreamService();

// module.exports = xtreamService;
