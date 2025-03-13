export const DEFAULT_ME_NODE = {
  name: "Me",
  gender: "MALE",
  occupation: "",
  age: null,
  birthDate: null,
  deathDate: null,
  birthPlace: null,
  deathPlace: null,
  hasSubTree: false,
  children: [],
  spouse: null,
  parent: null,
};

export const ERROR_MESSAGES = {
  CHILD_NAME_REQUIRED: "Child name is required.",
  SPOUSE_NAME_REQUIRED: "Spouse name is required.",
  SAVE_FAILED: "Failed to save the node. Please try again.",
  ADD_CHILD_FAILED: "Failed to add child.",
  ADD_SPOUSE_FAILED: "Failed to add spouse.",
};
