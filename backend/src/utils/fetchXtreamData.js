import axios from 'axios';

export const fetchXtreamData = async (connection, action, extraParams = {}) => {
  const { baseUrl, username, password } = connection;

  const params = new URLSearchParams({
    username,
    password,
    action,
    ...extraParams, 
  });

  const url = `${baseUrl}/player_api.php?${params.toString()}`;
  console.log('Fetching XTREAM data from URL:', url);

  try {
    const response = await axios.get(url, { timeout: 8000 });
    return response.data;
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



