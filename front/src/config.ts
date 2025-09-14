class Config {
  public readonly API_URL: string = import.meta.env.VITE_API_URL || this.getDefaultApiUrl();

  private getDefaultApiUrl(): string {
    // Check if running in Docker container
    if (window.location.hostname === 'localhost' && window.location.port === '7777') {
      return '/api';
    }
    // Default to local development
    return 'http://localhost:8000';
  }
}

export const config = new Config();
