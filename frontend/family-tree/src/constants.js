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
  width: 1100,
  height: 900,
};

export const CARD_DIMENSIONS = {
  w: 220,
  h: 70,
  img_w: 60,
  img_h: 60,
  img_x: 5,
  img_y: 5,
};
