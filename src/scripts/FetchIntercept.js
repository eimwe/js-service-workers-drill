class FetchIntercept {
  constructor() {
    // Store the original fetch method
    this.originalFetch = window.fetch;

    // Interceptor function to be customized
    this.interceptor = null;
  }

  // Method to set up the global interceptor
  setup(interceptorFn) {
    // Store the custom interceptor function
    this.interceptor = interceptorFn;

    // Override the global fetch method for ALL requests
    window.fetch = async (...args) => {
      // Call the interceptor if it exists
      if (this.interceptor) {
        const interceptorResult = await this.interceptor(...args);

        // If interceptor returns a Response, use it
        if (interceptorResult instanceof Response) {
          return interceptorResult;
        }

        // If interceptor returns modified args, use those
        if (Array.isArray(interceptorResult)) {
          args = interceptorResult;
        }
      }

      // Call the original fetch with (potentially modified) args
      return this.originalFetch(...args);
    };
  }

  // Method to restore original fetch
  restore() {
    window.fetch = this.originalFetch;
    this.interceptor = null;
  }
}

// Optional: Export for module usage
export default FetchIntercept;
