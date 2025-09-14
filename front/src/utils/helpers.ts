export function formatFileSize(size: number | string | null) {
  if (!size) {
    return "N/A";
  }
  size = typeof size === "string" ? parseInt(size) : size;
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const getShortUUID = (uuid: string): string => {
  return uuid.split("-")[0];
};

export const countryFlag: Record<string, string> = {
  USA: "🇺🇸",
  CAN: "🇨🇦",
};

export const excludeEmptyFields = (obj: Record<string, any>): Record<string, any> => {
  // Recursive function to handle nested objects
  const recurse = (data: Record<string, any>) => {
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Recursion in case value is a nested object
        const nestedObject = recurse(value);
        // Add nested object only if it's not empty after excluding empty fields
        if (Object.keys(nestedObject).length > 0) {
          acc[key] = nestedObject;
        }
      } else if (Array.isArray(value)) {
        // Process array to exclude empty fields from objects inside
        acc[key] = value
          .map((v) => (typeof v === "object" && v !== null ? recurse(v) : v))
          .filter((v) => (typeof v === "object" ? Object.keys(v).length > 0 : v !== ""));
      } else if (value && value.toString().trim() !== "") {
        // Include the field only if it is non-empty
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  };

  // Start processing the top-level object
  return recurse(obj);
};
