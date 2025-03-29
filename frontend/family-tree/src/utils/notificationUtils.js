export const showNotification = (message, type) => {
    console.log(`Notification [${type}]: ${message}`);
    alert(`${type.toUpperCase()}: ${message}`);
  };