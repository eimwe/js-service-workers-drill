import FetchIntercept from "./FetchIntercept.js";

const fetchIntercept = new FetchIntercept();

fetchIntercept.setup(async (url, options) => {
  console.log("Intercepted global fetch:", { url, options });

  if (url.includes("/users")) {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          name: "Mocked User",
          username: "mockuser",
          email: "mock@example.com",
        },
      ]),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (url.includes("/posts")) {
    return new Response(
      JSON.stringify([
        {
          id: 1,
          title: "Mocked Post",
          body: "This is a mocked post content",
        },
      ]),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (url.includes("/redirect")) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: "https://example.com/redirected",
      },
    });
  }

  if (url.includes("/text-message")) {
    return new Response("This is a plain text message", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Generic mock for any other URL
  return new Response(
    JSON.stringify({
      message: "Generic mock response",
      url: url,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
});

async function testFetches() {
  try {
    const users = await fetch("https://jsonplaceholder.typicode.com/users");
    const posts = await fetch("https://jsonplaceholder.typicode.com/posts");
    const textMessage = await fetch("/api/text-message");
    const redirect = await fetch("/api/redirect");

    console.log("Mocked Fetch Responses:", {
      users: await users.json(),
      posts: await posts.json(),
      textMessage: await textMessage.text(),
    });
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

// Reset to original fetch
// fetchIntercept.restore();

testFetches();
