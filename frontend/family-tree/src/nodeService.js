import axios from 'axios';

const API_URL = 'http://localhost:8080/api/persons';

export const fetchFamilyTree = async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      if (response.status === 200) {
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (typeof response.data === 'string') {
          console.warn('Received string response, attempting to parse:', response.data);
          try {
            const parsedData = JSON.parse(response.data);
            return Array.isArray(parsedData) ? parsedData : [];
          } catch (e) {
            console.error('Failed to parse string response:', e);
            return [];
          }
        }
        console.warn('Unexpected response data type, defaulting to empty array:', response.data);
        return [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching family tree:', error);
      throw error;
    }
  };
  
export const createPerson = async (personData) => {
  console.log("Creating person:", personData);
  const response = await axios.post(API_URL, personData);
  return response.data;
};

export const saveOrUpdateNode = async (nodeData, setTree, personId) => {
    if (!personId) {
      console.error('personId is undefined in saveOrUpdateNode:', nodeData);
      throw new Error('Invalid person ID');
    }
    console.log("Saving node:", nodeData);
    const response = await axios.put(`${API_URL}/${personId}`, nodeData);
    return response.data;
  };

export const addChild = async (parentId, childData) => {
  const response = await axios.post(`${API_URL}/${parentId}/child`, childData);
  return response.data;
};

export const addSpouse = async (personId, spouseData) => {
  console.log("Inside addSpouse:", personId, spouseData);
  const response = await axios.post(`${API_URL}/${personId}/spouse`, spouseData);
  return response.data;
};

export const MY_ID = 1;