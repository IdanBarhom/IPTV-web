import { fetchXtreamData } from './fetchXtreamData.js';

export const prefetchAllData = async (connection) => {
  console.log('🔄 Starting full prefetch...');
  
  try {
    await Promise.all([
      fetchXtreamData(connection, 'get_vod_categories'),
      fetchXtreamData(connection, 'get_series_categories'),
      fetchXtreamData(connection, 'get_live_categories'),
      fetchXtreamData(connection, 'get_vod_streams'),
      fetchXtreamData(connection, 'get_series'),
      fetchXtreamData(connection, 'get_live_streams')
    ]);
    
    console.log('✅ Full prefetch completed!');
    return true;
  } catch (err) {
    console.error('❌ Prefetch failed:', err.message);
    return false;
  }
};


// import { fetchXtreamData } from './fetchXtreamData.js';

// /**
//  * Prefetch כל הדאטה
//  */
// export const prefetchAllData = async (connection) => {
//   console.log('🔄 Starting prefetch for all categories and streams...');
  
//   try {
//     await Promise.all([
//       // קטגוריות
//       fetchXtreamData(connection, 'get_vod_categories'),
//       fetchXtreamData(connection, 'get_series_categories'),
//       fetchXtreamData(connection, 'get_live_categories'),
      
//       // כל הסטרימים
//       fetchXtreamData(connection, 'get_vod_streams'),
//       fetchXtreamData(connection, 'get_series'),
//       fetchXtreamData(connection, 'get_live_streams')
//     ]);
    
//     console.log('✅ Prefetch completed successfully!');
//     return true;
//   } catch (err) {
//     console.error('❌ Prefetch failed:', err.message);
//     return false;
//   }
// };