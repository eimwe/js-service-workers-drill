class CustomFetch {
  constructor() {
    this.swReady = false;
    this.setupServiceWorker();
  }

  async setupServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/scripts/service-worker.js",
          {
            scope: "/",
          }
        );

        // Wait for the service worker to be active
        if (registration.installing) {
          await new Promise((resolve) => {
            registration.installing.addEventListener("statechange", (e) => {
              if (e.target.state === "activated") {
                this.swReady = true;
                resolve();
              }
            });
          });
        } else if (registration.waiting) {
          await registration.waiting.activate();
          this.swReady = true;
        } else if (registration.active) {
          this.swReady = true;
        }

        console.log("ServiceWorker registered and active");
      } catch (error) {
        console.error("ServiceWorker registration failed:", error);
      }
    }
  }

  async fetch(url, options = {}) {
    // Wait for service worker to be ready
    if (!this.swReady) {
      await new Promise((resolve) => {
        const checkReady = () => {
          if (this.swReady) {
            resolve();
          } else {
            setTimeout(checkReady, 100);
          }
        };
        checkReady();
      });
    }

    const requestOptions = {
      method: options.method || "GET",
      headers: {
        ...options.headers,
        "Cache-Control": "max-age=86400",
      },
      body: options.body || null,
      mode: options.mode || "cors",
      credentials: options.credentials || "same-origin",
      cache: options.cache || "default",
      redirect: options.redirect || "follow",
      referrerPolicy: options.referrerPolicy || "no-referrer-when-downgrade",
    };

    try {
      const request = new Request(url, requestOptions);
      const response = await fetch(request);
      return response;
    } catch (error) {
      throw new Error(`Failed to fetch: ${error.message}`);
    }
  }
}

export default new CustomFetch();
