export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return Response.json({ error: "No API key found" });
  }

  try {
    // Test multiple endpoints
    const tests = [];
    
    // Test 1: List models (v1)
    const v1Res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );
    tests.push({
      endpoint: "v1/models",
      status: v1Res.status,
      ok: v1Res.ok,
      data: v1Res.ok ? await v1Res.json() : await v1Res.text()
    });

    // Test 2: List models (v1beta)
    const v1betaRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    tests.push({
      endpoint: "v1beta/models",
      status: v1betaRes.status,
      ok: v1betaRes.ok,
      data: v1betaRes.ok ? await v1betaRes.json() : await v1betaRes.text()
    });

    return Response.json({
      apiKeyPresent: true,
      apiKeyPrefix: apiKey.substring(0, 15) + "...",
      tests: tests
    });
    
  } catch (err) {
    return Response.json({ 
      error: String(err) 
    });
  }
}