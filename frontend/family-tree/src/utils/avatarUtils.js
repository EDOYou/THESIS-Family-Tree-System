import { updateAvatar, createMemoryBox } from "../nodeService";
import { showNotification } from "./notificationUtils";

export const handleAvatarUpdate = async ({
  nodeId,
  avatarUrl,
  nodeName,
  nodeType = "node", // e.g., "spouse", "child", "node"
  validate = false,
  throwOnError = true,
}) => {
  if (!avatarUrl) return { success: true }; // No avatar to update

  // Validate the avatar URL if required
  if (validate) {
    const isValidImageUrl = avatarUrl.match(
      /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif))$/
    );
    if (!isValidImageUrl) {
      console.error(
        `Invalid avatar URL for ${nodeType} ${nodeName} (${nodeId}):`,
        avatarUrl
      );
      showNotification(
        `Invalid avatar URL for ${nodeType}. Please provide a direct link to an image (e.g., https://example.com/image.jpg).`,
        "error"
      );
      if (throwOnError) {
        throw new Error(`Invalid avatar URL for ${nodeType}.`);
      }
      return { success: false, hasInvalidAvatar: true };
    }
  }

  try {
    await updateAvatar(nodeId, avatarUrl);
    // console.log(`Successfully updated avatar for ${nodeType} ${nodeName} (${nodeId})`); // Commented out for production
    return { success: true };
  } catch (error) {
    if (error.message.includes("MemoryBox not found")) {
      try {
        const memoryBoxData = { avatar: avatarUrl };
        await createMemoryBox(nodeId, memoryBoxData);
        // console.log(`Created new MemoryBox and set avatar for ${nodeType} ${nodeName} (${nodeId})`); // Commented out for production
        showNotification(
          `Created a new MemoryBox and updated avatar for ${nodeName}.`,
          "success"
        );
        return { success: true };
      } catch (createError) {
        console.error(
          `Failed to create MemoryBox for ${nodeType} ${nodeName} (${nodeId}):`,
          createError
        );
        showNotification(
          `Failed to create MemoryBox for ${nodeName}: ${createError.message}`,
          "error"
        );
        if (throwOnError) {
          throw createError;
        }
        return { success: false, hasInvalidAvatar: true };
      }
    } else {
      console.error(
        `Failed to update avatar for ${nodeType} ${nodeName} (${nodeId}):`,
        error
      );
      showNotification(
        `Failed to update avatar for ${nodeName}: ${error.message}`,
        "error"
      );
      if (throwOnError) {
        throw error;
      }
      return { success: false, hasInvalidAvatar: true };
    }
  }
};
