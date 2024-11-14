import customFetch from "./main.js";

async function testCaching() {
  console.log("Making first request...");
  try {
    const response1 = await customFetch.fetch(
      "https://jsonplaceholder.typicode.com/users"
    );
    const data1 = await response1.json();
    console.log("First request data:", data1);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Making second request...");
    const response2 = await customFetch.fetch(
      "https://jsonplaceholder.typicode.com/users"
    );
    const data2 = await response2.json();
    console.log("Second request data:", data2);
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testCaching();
