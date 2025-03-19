import axios from "axios";

const API_URL = "http://localhost:8080/api/persons";

export const fetchFamilyTree = async () => {
  try {
    const response = await axios.get(`${API_URL}/all`);
    if (response.status === 200) {
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (typeof response.data === "string") {
        console.warn(
          "Received string response, attempting to parse:",
          response.data
        );
        try {
          const parsedData = JSON.parse(response.data);
          return Array.isArray(parsedData) ? parsedData : [];
        } catch (e) {
          console.error("Failed to parse string response:", e);
          return [];
        }
      }
      console.warn(
        "Unexpected response data type, defaulting to empty array:",
        response.data
      );
      return [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching family tree:", error);
    throw new Error("Failed to fetch family tree: " + error.message);
  }
};

export const createPerson = async (personData) => {
  try {
    console.log("Creating person:", personData);
    const response = await axios.post(API_URL, personData);
    return response.data;
  } catch (error) {
    console.error("Error creating person:", error);
    throw new Error("Failed to create person: " + error.message);
  }
};

export const saveOrUpdateNode = async (nodeData, personId) => {
  try {
    if (!personId || typeof personId !== "string") {
      throw new Error("Invalid person ID: " + personId);
    }
    console.log("Saving node:", nodeData);
    const response = await axios.put(`${API_URL}/${personId}`, nodeData);
    return response.data;
  } catch (error) {
    console.error("Error saving node:", error);
    throw new Error("Failed to save node: " + error.message);
  }
};
export const addChild = async (personId, childData) => {
  try {
    const response = await axios.post(
      `${API_URL}/${personId}/child`,
      childData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding child:", error);
    throw new Error("Failed to add child: " + error.message);
  }
};

export const addSpouse = async (personId, spouseData) => {
  try {
    console.log("Inside addSpouse:", personId, spouseData);
    const response = await axios.post(
      `${API_URL}/${personId}/spouse`,
      spouseData
    );
    return response.data;
  } catch (error) {
    console.error("Error adding spouse:", error);
    throw new Error("Failed to add spouse: " + error.message);
  }
};

export const deletePerson = async (personId) => {
  try {
    const response = await axios.delete(`${API_URL}/${personId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting person:", error);
    throw new Error("Failed to delete person: " + error.message);
  }
};
