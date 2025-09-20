export const isValidAvatarFileName = (filename: string): boolean => {
  if (!filename) {
    return false;
  }

  // Check for invalid characters (only allow letters, numbers, underscores, and hyphens)
  const invalidChars = /[^a-zA-Z0-9_.-]/;
  if (invalidChars.test(filename)) {
    return false;
  }

  // Check for length (e.g., less than 255 characters)
  if (filename.length > 255) {
    return false;
  }

  // Check for valid file extension
  const validExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
  const fileExtension = filename.slice(filename.lastIndexOf('.'));
  if (!validExtensions.includes(fileExtension.toLowerCase())) {
    return false;
  }

  return true;
};
