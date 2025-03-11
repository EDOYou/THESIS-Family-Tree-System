import axios from 'axios';

const API_URL = 'http://localhost:8080/api/persons';

export const fetchFamilyTree = async () => {
  const response = await axios.get(`${API_URL}/tree`);
  return response.data;
};

export const saveOrUpdateNode = async (nodeData, setTree, nodeId) => {
  try {
    let nodeExists = false;

    try {
      const response = await axios.get(`${API_URL}/${nodeId}`);
      if (response.status === 200) {
        nodeExists = true;
      }
    } catch (getError) {
      if (getError.response && getError.response.status === 404) {
        console.log(`Node with id=${nodeId} not found, proceeding to create.`);
      } else {
        throw getError;
      }
    }

    let updatedNode;
    if (nodeExists) {
      const response = await axios.put(`${API_URL}/${nodeId}`, nodeData);
      updatedNode = response.data;
      console.log(`Updated node with id ${nodeId}`);
    } else {
      const response = await axios.post(`${API_URL}`, {
        ...nodeData,
        id: nodeId === MY_ID ? 1 : nodeId,
      });
      updatedNode = response.data;
      console.log(`Created node with id ${nodeId}`);
    }

    return updatedNode;
  } catch (error) {
    console.error('Error saving/updating node:', error.message);
    throw error;
  }
};

export const MY_ID = 1;