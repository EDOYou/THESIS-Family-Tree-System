const isDebugMode = false;

export const logDebug = (message, data) => {
  if (isDebugMode) {
    if (data !== undefined) {
      console.log(message, JSON.stringify(data, null, 2));
    } else {
      console.log(message);
    }
  }
};
