const baseUrl = (process.env.SMOKE_BASE_URL ?? process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");

async function expectStatus(path, expectedStatus) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: "follow",
  });

  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `${path} returned ${response.status}, expected ${expectedStatus}. Response body: ${body}`,
    );
  }

  console.log(`${path} -> ${response.status}`);
}

await expectStatus("/api/health", 200);
await expectStatus("/sign-in", 200);
await expectStatus("/api/portfolios", 401);

console.log(`HTTP smoke check passed for ${baseUrl}.`);
