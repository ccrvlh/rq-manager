class LocalStorage {
  private readonly prefix;

  constructor(prefix = "rqm") {
    this.prefix = prefix;
  }

  /**
   * Stores a value in localStorage
   * @param key The key to store the value under
   * @param value The value to store
   */
  set<T>(key: string, value: T): void {
    const prefixedKey = `${this.prefix}-${key}`;
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(prefixedKey, serializedValue);
  }

  /**
   * Retrieves a value from localStorage
   * @param key The key to retrieve the value for
   * @returns The retrieved value, or null if the key doesn't exist
   */
  get<T>(key: string): T | null {
    const prefixedKey = `${this.prefix}-${key}`;
    const serializedValue = localStorage.getItem(prefixedKey);
    if (serializedValue === null) {
      return null;
    }
    return JSON.parse(serializedValue) as T;
  }

  /**
   * Removes a value from localStorage
   * @param key The key to remove the value for
   */
  remove(key: string): void {
    const prefixedKey = `${this.prefix}-${key}`;
    localStorage.removeItem(prefixedKey);
  }

  /**
   * Clears all items from the local storage that have keys starting with the specified prefix.
   */
  clear() {
    const keys = Object.keys(localStorage).filter((key) =>
      key.startsWith(this.prefix)
    );
    keys.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Returns the key with the prefix added.
   * @param key - The key to be prefixed.
   * @returns The key with the prefix added.
   */
  getPrefixedKey(key: string) {
    return `${this.prefix}${key}`;
  }
}

const storage = new LocalStorage();

export { storage };
