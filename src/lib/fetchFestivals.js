import axios from 'axios';


const API_KEY = 'cG5mrkwEwspkbOqiOX87JPuIEPxamRaF';

const fetchFestivals = async (year, country) => {
  const url = `https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${country}&year=${year}`;
  
  try {
    const response = await axios.get(url);
    return response.data.response.holidays;
  } catch (error) {
    console.error('Error fetching festival data:', error);
    return [];
  }
};

export default fetchFestivals;
