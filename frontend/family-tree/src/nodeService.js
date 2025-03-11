import axios from 'axios';

const API_URL = 'http://localhost:8080/api/persons';

export const fetchFamilyTree = async () => {
  const response = await axios.get(`${API_URL}/root`);
  return response.data;
};

export const createPerson = async (personData) => {
  console.log("Creating person:", personData);
  const response = await axios.post(API_URL, personData);
  return response.data;
};

export const saveOrUpdateNode = async (nodeData, setTree, personId) => {
  console.log("Saving node:", nodeData);
  const response = await axios.put(`${API_URL}/${personId}`, nodeData);
  return response.data;
};

export const addChild = async (parentId, childData) => {
  const response = await axios.post(`${API_URL}/${parentId}/child`, childData);
  return response.data;
};

export const addSpouse = async (personId, spouseData) => {
  const response = await axios.post(`${API_URL}/${personId}/spouse`, spouseData);
  return response.data;
};

export const MY_ID = 1;