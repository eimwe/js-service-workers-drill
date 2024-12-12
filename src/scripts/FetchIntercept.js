class FetchIntercept {
  constructor() {
    // Original fetch method stored
    this.originalFetch = window.fetch;

    // Interceptor function to be customized
    this.interceptor = null;

    // Flag to control fetch behavior
    this.isMockEnabled = true;
  }

  setup(interceptorFn) {
    this.interceptor = interceptorFn;

    // Override the global fetch method for ALL requests
    window.fetch = async (...args) => {
      if (!this.isMockEnabled) {
        return this.originalFetch(...args);
      }

      // Pre-fetch interceptor
      if (this.interceptor) {
        const interceptorResult = await this.interceptor(...args);

        if (interceptorResult instanceof Response) {
          const locationHeader = interceptorResult.headers.get("Location");
          if (locationHeader) {
            window.location.href = locationHeader;
            return interceptorResult;
            // all subsequent fetches must be invalid!
          }

          // Handle content type for mocked responses
          const contentType =
            interceptorResult.headers.get("Content-Type") || "";

          if (contentType.includes("text/plain")) {
            const messageText = await interceptorResult.text();
            console.log("Plain Text Message:", messageText);
            alert(messageText);
          } else if (contentType) {
            console.log("Non-Plain Text Response");
            alert("Received a response with non-plain text content type");
          }

          return interceptorResult;
        }

        // If interceptor returns modified args, create a mock response
        if (Array.isArray(interceptorResult)) {
          // Create a default mock response if no specific mock is provided
          return new Response(
            JSON.stringify({
              message: "Request modified but no specific mock provided",
              originalArgs: interceptorResult,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // If no interceptor or no return, create a generic mock response
      return new Response(
        JSON.stringify({
          message: "No specific mock response defined",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    };
  }

  restore() {
    this.isMockEnabled = false;
    window.fetch = this.originalFetch;
    this.interceptor = null;
  }

  enableMock() {
    this.isMockEnabled = true;
  }
}

export default FetchIntercept;
