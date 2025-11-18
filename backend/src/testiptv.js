import axios from 'axios';

// 👇 הכנס פה את הפרטים האמיתיים שלך
const baseUrl = 'http://a10.lion.wine:80';
const username = '7XPU1376';
const password = 'yneX4743';

// בונה את ה־API URL
const apiUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_categories`;

async function testIptv() {
  try {
    console.log('📡 Checking IPTV server...\n');

    const { data } = await axios.get(apiUrl, { timeout: 8000 });

    console.log('✅ SUCCESS! Server responded:\n');
    console.log(JSON.stringify(data, null, 2));  // מדפיס תגובה מלאה

  } catch (error) {
    console.log('❌ Connection failed\n');

    if (error.response) {
      console.log('Server responded with status:', error.response.status);
      console.log('Response:', error.response.data);
    } else {
      console.log('Error message:', error.message);
    }
  }
}

testIptv();
