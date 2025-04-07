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
  spouseId: null,
  fatherId: null,
  motherId: null,
};

export const ERROR_MESSAGES = {
  CHILD_NAME_REQUIRED: "Child name is required.",
  SPOUSE_NAME_REQUIRED: "Spouse name is required.",
  SAVE_FAILED: "Failed to save the node. Please try again.",
  ADD_CHILD_FAILED: "Failed to add child.",
  ADD_SPOUSE_FAILED: "Failed to add spouse.",
};

export const CHART_DIMENSIONS = {
  width: 1200,
  height: 800,
};

export const FAMILY_CHART_CONTAINER_ID = "FamilyChart";

// Form constants
export const VIEW_FIELDS = [
  { type: "text", label: "First Name", id: "firstName" },
  { type: "text", label: "Last Name", id: "lastName" },
  { type: "text", label: "Occupation", id: "occupation" },
  { type: "text", label: "Age", id: "age" },
  { type: "text", label: "Birth Date", id: "birthDate" },
  { type: "text", label: "Death Date", id: "deathDate" },
  { type: "text", label: "Birth Place", id: "birthPlace" },
  { type: "text", label: "Death Place", id: "deathPlace" },
];

export const EDIT_FIELDS = [
  { type: "text", label: "First Name", id: "firstName" },
  { type: "text", label: "Last Name", id: "lastName" },
  { type: "text", label: "Occupation", id: "occupation" },
  { type: "text", label: "Age", id: "age" },
  { type: "text", label: "Birth Date", id: "birthDate" },
  { type: "text", label: "Death Date", id: "deathDate" },
  { type: "text", label: "Birth Place", id: "birthPlace" },
  { type: "text", label: "Death Place", id: "deathPlace" },
  { type: "text", label: "Has Sub Tree", id: "hasSubTree" },
  { type: "text", label: "Avatar URL", id: "avatar" },
];

// Relationship constants
export const RELATIONSHIP_TYPES = [
  "father",
  "mother",
  "spouse",
  "son",
  "daughter",
];
