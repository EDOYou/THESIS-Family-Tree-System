import axios from "./axiosInstance";

const API_URL = "/api/persons";
const MEMORY_BOX_API_URL = "/api/memory-boxes";

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

export const updateAvatar = async (personId, avatarUrl) => {
  try {
    const memoryBoxResponse = await axios.get(
      `${MEMORY_BOX_API_URL}/person/${personId}`
    );
    if (memoryBoxResponse.status !== 200 || !memoryBoxResponse.data.id) {
      throw new Error("MemoryBox not found for person: " + personId);
    }
    const memoryBoxId = memoryBoxResponse.data.id;
    console.log("Fetched MemoryBox ID for person", personId, ":", memoryBoxId);

    const response = await axios.put(
      `${MEMORY_BOX_API_URL}/${memoryBoxId}/avatar`,
      avatarUrl,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Raw response from updateAvatar:", response);
    console.log("Avatar updated successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error updating avatar:", error);
    if (error.message.includes("MemoryBox not found")) {
      try {
        const newMemoryBox = { avatar: avatarUrl };
        const createdMemoryBox = await createMemoryBox(personId, newMemoryBox);
        return createdMemoryBox;
      } catch (createError) {
        console.error(
          "Failed to create MemoryBox after not found:",
          createError
        );
        throw createError;
      }
    }
    throw new Error("Failed to update avatar: " + error.message);
  }
};

export const fetchAllMemoryBoxes = async () => {
  try {
    const response = await axios.get(MEMORY_BOX_API_URL);
    if (response.status === 200) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Error fetching memory boxes:", error);
    throw new Error("Failed to fetch memory boxes: " + error.message);
  }
};

export const fetchMemoryBoxById = async (memoryBoxId) => {
  try {
    const response = await axios.get(`${MEMORY_BOX_API_URL}/${memoryBoxId}`);
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("MemoryBox not found");
  } catch (error) {
    console.error("Error fetching memory box:", error);
    throw new Error("Failed to fetch memory box: " + error.message);
  }
};

export const fetchMemoryBoxByPersonId = async (personId) => {
  try {
    const response = await axios.get(
      `${MEMORY_BOX_API_URL}/person/${personId}`
    );
    if (response.status === 200) {
      return response.data;
    }
    throw new Error("MemoryBox not found for person: " + personId);
  } catch (error) {
    console.error("Error fetching memory box by personId:", error);
    throw new Error("Failed to fetch memory box by personId: " + error.message);
  }
};

export const createMemoryBox = async (personId, memoryBoxData) => {
  try {
    console.log("Creating memory box for person:", personId, memoryBoxData);
    const response = await axios.post(
      `${MEMORY_BOX_API_URL}/person/${personId}`,
      memoryBoxData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating memory box:", error);
    throw new Error("Failed to create memory box: " + error.message);
  }
};

export const updateMemoryBoxAvatar = async (memoryBoxId, avatarUrl) => {
  try {
    const response = await axios.put(
      `${MEMORY_BOX_API_URL}/${memoryBoxId}/avatar`,
      avatarUrl,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating memory box avatar:", error);
    throw new Error("Failed to update memory box avatar: " + error.message);
  }
};

export const deleteMemoryBox = async (memoryBoxId) => {
  try {
    const response = await axios.delete(`${MEMORY_BOX_API_URL}/${memoryBoxId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting memory box:", error);
    throw new Error("Failed to delete memory box: " + error.message);
  }
};
