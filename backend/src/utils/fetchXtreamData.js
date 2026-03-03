import axios from 'axios';
import cacheService from '../services/cacheService.js';

/**
 * יצירת cache key ייחודי
 */
const getCacheKey = (connection, action, extraParams = {}) => {
  const paramsStr = Object.keys(extraParams).length > 0 
    ? JSON.stringify(extraParams) 
    : '';
  
  const credentials = Buffer.from(
    `${connection.baseUrl}:${connection.username}:${connection.password}:${action}:${paramsStr}`
  ).toString('base64');
  
  return `xtream:${credentials}`;
};

/**
 * Flag למניעת prefetch מרובים במקביל
 */
const prefetchInProgress = new Set();

/**
 * משיכה של action בודד מXtream
 */
const fetchSingleAction = async (connection, action, extraParams = {}) => {
  const { baseUrl, username, password } = connection;

  const params = new URLSearchParams({
    username,
    password,
    action,
    ...extraParams, 
  });

  const url = `${baseUrl}/player_api.php?${params.toString()}`;
  
  // Timeout דינמי: ארוך יותר ל-streams
  const timeout = action.includes('streams') || action.includes('series') 
    ? 30000  // 30 שניות
    : 10000; // 10 שניות
  
  const response = await axios.get(url, { timeout });
  const data = response.data;

  const cacheKey = getCacheKey(connection, action, extraParams);
  cacheService.set(cacheKey, data, 3600);
  console.log(`✅ [Cached] ${action}`);

  return data;
};

/**
 * Background prefetch - משיכת כל הדאטה ברקע
 */
const backgroundPrefetch = async (connection) => {
  // יצירת key ייחודי למשתמש
  const userKey = `${connection.baseUrl}:${connection.username}`;
  
  // אם כבר רץ prefetch למשתמש הזה - דלג
  if (prefetchInProgress.has(userKey)) {
    console.log('⏩ Prefetch already in progress, skipping...');
    return;
  }

  // סמן שprefetch רץ
  prefetchInProgress.add(userKey);
  console.log('🔄 Background re-prefetch started...');
  
  const actions = [
    'get_vod_categories',
    'get_series_categories',
    'get_live_categories',
    'get_vod_streams',
    'get_series',
    'get_live_streams'
  ];
  
  try {
    for (const action of actions) {
      const key = getCacheKey(connection, action);
      
      if (!cacheService.has(key)) {
        console.log(`🔄 Prefetching ${action}...`);
        await fetchSingleAction(connection, action);
      } else {
        console.log(`⏩ Skipping ${action} (already cached)`);
      }
    }
    console.log('✅ Background prefetch completed!');
  } catch (err) {
    console.error('❌ Background prefetch error:', err.message);
  } finally {
    // הסר flag אחרי שסיים
    prefetchInProgress.delete(userKey);
  }
};

/**
 * בדיקה אם צריך re-prefetch
 */
const shouldReprefetch = (connection) => {
  const mainActions = [
    'get_vod_categories',
    'get_series_categories', 
    'get_live_categories'
  ];
  
  for (const action of mainActions) {
    const key = getCacheKey(connection, action);
    if (!cacheService.has(key)) {
      return true;
    }
  }
  
  return false;
};

/**
 * הפונקציה הראשית - משיכת דאטה עם cache
 */
export const fetchXtreamData = async (connection, action, extraParams = {}) => {
  // בדיקת cache
  const cacheKey = getCacheKey(connection, action, extraParams);
  const cachedData = cacheService.get(cacheKey);
  
  if (cachedData) {
    console.log(`✅ [Cache HIT] ${action}`);
    return cachedData;
  }

  console.log(`❌ [Cache MISS] ${action}`);
  
  // אם cache פג תוקף, הפעל re-prefetch ברקע
  if (shouldReprefetch(connection)) {
    const userKey = `${connection.baseUrl}:${connection.username}`;
    if (!prefetchInProgress.has(userKey)) {
      console.log('🔄 Cache expired, triggering background re-prefetch...');
      backgroundPrefetch(connection); // לא await - רץ ברקע!
    }
  }

  // משוך את מה שהמשתמש ביקש עכשיו
  console.log(`Fetching ${action} from Xtream...`);
  
  try {
    return await fetchSingleAction(connection, action, extraParams);
  } catch (error) {
    if (error.response) {
      throw {
        status: error.response.status,
        message: 'XTREAM_SERVER_ERROR',
        data: error.response.data,
      };
    }

    throw {
      status: 500,
      message: 'XTREAM_CONNECTION_FAILED',
      data: error.message,
    };
  }
};

// import axios from 'axios';
// import cacheService from '../services/cacheService.js';

// const getCacheKey = (connection, action, extraParams = {}) => {
//   const paramsStr = Object.keys(extraParams).length > 0 
//     ? JSON.stringify(extraParams) 
//     : '';
  
//   const credentials = Buffer.from(
//     `${connection.baseUrl}:${connection.username}:${connection.password}:${action}:${paramsStr}`
//   ).toString('base64');
  
//   return `xtream:${credentials}`;
// };

// /**
//  * ✅ משיכה של action בודד (ללא prefetch logic)
//  */
// const fetchSingleAction = async (connection, action, extraParams = {}) => {
//   const { baseUrl, username, password } = connection;

//   const params = new URLSearchParams({
//     username,
//     password,
//     action,
//     ...extraParams, 
//   });

//   const url = `${baseUrl}/player_api.php?${params.toString()}`;
  
//   // ✅ timeout דינמי: ארוך יותר ל-streams
//   const timeout = action.includes('streams') || action.includes('series') 
//     ? 30000  // 30 שניות
//     : 10000; // 10 שניות
  
//   const response = await axios.get(url, { timeout });
//   const data = response.data;

//   const cacheKey = getCacheKey(connection, action, extraParams);
//   cacheService.set(cacheKey, data, 3600);
//   console.log(`✅ [Cached] ${action}`);

//   return data;
// };

// /**
//  * ✅ פונקציה פנימית ל-background prefetch
//  */
// const backgroundPrefetch = async (connection) => {
//   console.log('🔄 Background re-prefetch started...');
  
//   const actions = [
//     'get_vod_categories',
//     'get_series_categories',
//     'get_live_categories',
//     'get_vod_streams',
//     'get_series',
//     'get_live_streams'
//   ];
  
//   try {
//     for (const action of actions) {
//       const key = getCacheKey(connection, action);
      
//       // ✅ רק אם באמת לא קיים!
//       if (!cacheService.has(key)) {
//         console.log(`🔄 Prefetching ${action}...`);
//         fetchSingleAction(connection, action)
//           .catch(err => console.error(`❌ Failed to prefetch ${action}:`, err.message));
//       } else {
//         console.log(`⏩ Skipping ${action} (already cached)`);
//       }
//     }
//   } catch (err) {
//     console.error('Background prefetch error:', err);
//   }
// };

// /**
//  * בדיקה אם צריך re-prefetch
//  */
// const shouldReprefetch = (connection) => {
//   const mainActions = [
//     'get_vod_categories',
//     'get_series_categories', 
//     'get_live_categories'
//   ];
  
//   for (const action of mainActions) {
//     const key = getCacheKey(connection, action);
//     if (!cacheService.has(key)) {
//       return true;
//     }
//   }
  
//   return false;
// };

// /**
//  * ✅ הפונקציה הראשית
//  */
// export const fetchXtreamData = async (connection, action, extraParams = {}) => {
//   // 1️⃣ בדיקת cache
//   const cacheKey = getCacheKey(connection, action, extraParams);
//   const cachedData = cacheService.get(cacheKey);
  
//   if (cachedData) {
//     console.log(`✅ [Cache HIT] ${action}`);
//     return cachedData;
//   }

//   // 2️⃣ Cache MISS
//   console.log(`❌ [Cache MISS] ${action}`);
  
//   // ✅ אם צריך re-prefetch, עושה זאת ברקע (פעם אחת בלבד!)
//   if (shouldReprefetch(connection)) {
//     console.log('🔄 Cache expired, triggering background re-prefetch...');
//     backgroundPrefetch(connection); // לא await!
//   }

//   // 3️⃣ משוך את מה שביקשו עכשיו
//   console.log(`Fetching ${action} from Xtream...`);
  
//   try {
//     return await fetchSingleAction(connection, action, extraParams);
//   } catch (error) {
//     if (error.response) {
//       throw {
//         status: error.response.status,
//         message: 'XTREAM_SERVER_ERROR',
//         data: error.response.data,
//       };
//     }

//     throw {
//       status: 500,
//       message: 'XTREAM_CONNECTION_FAILED',
//       data: error.message,
//     };
//   }
// };

// import axios from 'axios';
// import cacheService from '../services/cacheService.js';

// const getCacheKey = (connection, action, extraParams = {}) => {
//   const paramsStr = Object.keys(extraParams).length > 0 
//     ? JSON.stringify(extraParams) 
//     : '';
  
//   const credentials = Buffer.from(
//     `${connection.baseUrl}:${connection.username}:${connection.password}:${action}:${paramsStr}`
//   ).toString('base64');
  
//   return `xtream:${credentials}`;
// };

// /**
//  * ✅ פונקציה פנימית ל-prefetch
//  */
// const backgroundPrefetch = async (connection) => {
//   console.log('🔄 Background re-prefetch started...');
  
//   const actions = [
//     'get_vod_categories',
//     'get_series_categories',
//     'get_live_categories',
//     'get_vod_streams',
//     'get_series',
//     'get_live_streams'
//   ];
  
//   try {
//     // משוך בנפרד (לא await) כדי שלא לחסום
//     for (const action of actions) {
//       const key = getCacheKey(connection, action);
//       if (!cacheService.has(key)) {
//         // רק אם לא קיים, משוך
//         fetchSingleAction(connection, action)
//           .catch(err => console.error(`Failed to prefetch ${action}:`, err));
//       }
//     }
//   } catch (err) {
//     console.error('Background prefetch error:', err);
//   }
// };

// /**
//  * ✅ משיכה של action בודד (ללא prefetch logic)
//  */
// const fetchSingleAction = async (connection, action, extraParams = {}) => {
//   const { baseUrl, username, password } = connection;

//   const params = new URLSearchParams({
//     username,
//     password,
//     action,
//     ...extraParams, 
//   });

//   const url = `${baseUrl}/player_api.php?${params.toString()}`;
  
//   const response = await axios.get(url, { timeout: 8000 });
//   const data = response.data;

//   const cacheKey = getCacheKey(connection, action, extraParams);
//   cacheService.set(cacheKey, data, 3600);
//   console.log(`✅ [Cached] ${action}`);

//   return data;
// };

// /**
//  * בדיקה אם צריך re-prefetch
//  */
// const shouldReprefetch = (connection) => {
//   const mainActions = [
//     'get_vod_categories',
//     'get_series_categories', 
//     'get_live_categories'
//   ];
  
//   for (const action of mainActions) {
//     const key = getCacheKey(connection, action);
//     if (!cacheService.has(key)) {
//       return true;
//     }
//   }
  
//   return false;
// };

// /**
//  * ✅ הפונקציה הראשית
//  */
// export const fetchXtreamData = async (connection, action, extraParams = {}) => {
//   // 1️⃣ בדיקת cache
//   const cacheKey = getCacheKey(connection, action, extraParams);
//   const cachedData = cacheService.get(cacheKey);
  
//   if (cachedData) {
//     console.log(`✅ [Cache HIT] ${action}`);
//     return cachedData;
//   }

//   // 2️⃣ Cache MISS
//   console.log(`❌ [Cache MISS] ${action}`);
  
//   // ✅ אם צריך re-prefetch, עושה זאת ברקע
//   if (shouldReprefetch(connection)) {
//     console.log('🔄 Cache expired, triggering background re-prefetch...');
//     // לא מחכים לזה!
//     backgroundPrefetch(connection);
//   }

//   // 3️⃣ משוך את מה שביקשו עכשיו (בנפרד)
//   console.log(`Fetching ${action} from Xtream...`);
  
//   try {
//     return await fetchSingleAction(connection, action, extraParams);
//   } catch (error) {
//     if (error.response) {
//       throw {
//         status: error.response.status,
//         message: 'XTREAM_SERVER_ERROR',
//         data: error.response.data,
//       };
//     }

//     throw {
//       status: 500,
//       message: 'XTREAM_CONNECTION_FAILED',
//       data: error.message,
//     };
//   }
// };

// import axios from 'axios';
// import cacheService from '../services/cacheService.js';

// /**
//  * יצירת cache key ייחודי
//  */
// const getCacheKey = (connection, action, extraParams = {}) => {
//   const paramsStr = Object.keys(extraParams).length > 0 
//     ? JSON.stringify(extraParams) 
//     : '';
  
//   const credentials = Buffer.from(
//     `${connection.baseUrl}:${connection.username}:${connection.password}:${action}:${paramsStr}`
//   ).toString('base64');
  
//   return `xtream:${credentials}`;
// };

// /**
//  * בדיקה אם צריך re-prefetch
//  */
// const shouldReprefetch = (connection) => {
//   // בודק אם אחד מה-actions המרכזיים לא קיים
//   const mainActions = [
//     'get_vod_categories',
//     'get_series_categories', 
//     'get_live_categories'
//   ];
  
//   for (const action of mainActions) {
//     const key = getCacheKey(connection, action);
//     if (!cacheService.has(key)) {
//       return true; // אחד מהם לא קיים = צריך prefetch
//     }
//   }
  
//   return false; // הכל קיים
// };

// export const fetchXtreamData = async (connection, action, extraParams = {}) => {
//   // 1️⃣ בדיקת cache
//   const cacheKey = getCacheKey(connection, action, extraParams);
//   const cachedData = cacheService.get(cacheKey);
  
//   if (cachedData) {
//     console.log(`✅ [Cache HIT] ${action}`);
//     return cachedData;
//   }

//   // 2️⃣ Cache MISS - בודק אם צריך re-prefetch
//   console.log(`❌ [Cache MISS] ${action}`);
  
//   // ✅ אם אחד מה-actions המרכזיים נעדר, עושה prefetch מלא ברקע
//   if (shouldReprefetch(connection)) {
//     console.log('🔄 Cache expired, triggering background re-prefetch...');
    
//     // ✅ Import dynamically כדי להימנע מ-circular dependency
//     import('./prefetchHelper.js').then(module => {
//       module.prefetchAllData(connection)
//         .catch(err => console.error('Background prefetch error:', err));
//     });
//   }

//   // 3️⃣ בינתיים, משוך את מה שביקשו עכשיו
//   console.log(`Fetching ${action} from Xtream...`);

//   const { baseUrl, username, password } = connection;

//   const params = new URLSearchParams({
//     username,
//     password,
//     action,
//     ...extraParams, 
//   });

//   const url = `${baseUrl}/player_api.php?${params.toString()}`;
//   console.log('Fetching XTREAM data from URL:', url);

//   try {
//     const response = await axios.get(url, { timeout: 8000 });
//     const data = response.data;

//     // 4️⃣ שמירה ב-cache (1 שעה)
//     cacheService.set(cacheKey, data, 3600);
//     console.log(`✅ [Cached] ${action}`);

//     return data;

//   } catch (error) {
//     if (error.response) {
//       throw {
//         status: error.response.status,
//         message: 'XTREAM_SERVER_ERROR',
//         data: error.response.data,
//       };
//     }

//     throw {
//       status: 500,
//       message: 'XTREAM_CONNECTION_FAILED',
//       data: error.message,
//     };
//   }
// };


// import axios from 'axios';

// export const fetchXtreamData = async (connection, action, extraParams = {}) => {
//   const { baseUrl, username, password } = connection;

//   const params = new URLSearchParams({
//     username,
//     password,
//     action,
//     ...extraParams, 
//   });

//   const url = `${baseUrl}/player_api.php?${params.toString()}`;
//   console.log('Fetching XTREAM data from URL:', url);

//   try {
//     const response = await axios.get(url, { timeout: 8000 });
//     return response.data;
//   } catch (error) {
//     if (error.response) {
//       throw {
//         status: error.response.status,
//         message: 'XTREAM_SERVER_ERROR',
//         data: error.response.data,
//       };
//     }

//     throw {
//       status: 500,
//       message: 'XTREAM_CONNECTION_FAILED',
//       data: error.message,
//     };
//   }
// };



