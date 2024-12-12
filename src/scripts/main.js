import FetchIntercept from "./FetchIntercept.js";

const fetchIntercept = new FetchIntercept();

fetchIntercept.setup(async (url, options) => {
  console.log("Intercepted global fetch:", { url, options });

  // Example: Add a global header to every request
  options = options || {};
  options.headers = {
    ...options.headers,
    "X-Global-Intercept": "Active",
  };

  // Example: Modify or mock specific URLs
  if (url.includes("jsonplaceholder")) {
    console.log("JSONPlaceholder request detected");
    // You could add special handling here
  }

  // Return modified request
  return [url, options];

  /*return new Response(
    JSON.stringify([
      { id: 1, name: "Intercepted User", username: "interceptor" },
    ]),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );*/
});

async function testFetches() {
  try {
    const users = await fetch("https://jsonplaceholder.typicode.com/users");
    const posts = await fetch("https://jsonplaceholder.typicode.com/posts");
    const todos = await fetch("https://jsonplaceholder.typicode.com/todos");

    console.log("Fetch responses:", {
      users: await users.json(),
      posts: await posts.json(),
      todos: await todos.json(),
    });
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

testFetches();

// Optional: Restore original fetch
// fetchIntercept.restore();
