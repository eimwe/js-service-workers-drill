class FetchIntercept {
  constructor() {
    // Original fetch method stored
    this.originalFetch = window.fetch;

    // Interceptor function to be customized
    this.interceptor = null;

    // Flag to control fetch behavior
    this.isMockEnabled = true;

    // Flag to block subsequent fetches
    this.isRedirecting = false;
  }

  setup(interceptorFn) {
    this.interceptor = interceptorFn;

    // Override the global fetch method for ALL requests
    window.fetch = async (...args) => {
      if (this.isRedirecting) {
        console.warn("Fetch blocked due to ongoing redirect");
        return new Response(null, { status: 403, statusText: "Fetch Blocked" });
      }

      if (!this.isMockEnabled) {
        return this.originalFetch(...args);
      }

      // Pre-fetch interceptor
      if (this.interceptor) {
        const interceptorResult = await this.interceptor(...args);

        // Clone the response to allow multiple reads
        const clonedResponse = interceptorResult.clone();

        if (interceptorResult instanceof Response) {
          const locationHeader = clonedResponse.headers.get("Location");
          if (locationHeader) {
            this.isRedirecting = true;
            window.location.href = locationHeader;

            // Prevent any further fetch requests
            window.fetch = () => {
              console.warn("Fetch blocked due to redirect");
              return new Response(null, {
                status: 403,
                statusText: "Fetch Blocked",
              });
            };

            return interceptorResult;
            // all subsequent fetches must be invalid!
          }

          // Handle content type for mocked responses
          const contentType = clonedResponse.headers.get("Content-Type") || "";

          if (contentType.includes("text/plain")) {
            const messageText = await clonedResponse.text();
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
    this.isRedirecting = false;
    window.fetch = this.originalFetch;
    this.interceptor = null;
  }

  enableMock() {
    this.isMockEnabled = true;
    this.isRedirecting = false;
  }
}

export default FetchIntercept;
