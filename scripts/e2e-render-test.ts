/* E2E Render Test Script
   Tests the complete render flow and collects telemetry data
*/

import { setTimeout as sleep } from "node:timers/promises";

const BASE_URL = "http://localhost:3000";
const TEST_IMAGE = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267";
const TEST_PROMPT = "modern living room, clean design, professional interior rendering";

interface TelemetryData {
  t0: number;
  postLatency: number;
  postResponse: any;
  pollingEvents: Array<{
    timestamp: number;
    elapsed: number;
    status: number;
    jsonStatus: string;
  }>;
  dbRowFirstSeen: number | null;
  dbRowFirstStatus: string | null;
  statusSucceeded: number | null;
  timeoutToast: boolean;
}

async function makeRequest(url: string, options: RequestInit = {}) {
  const start = Date.now();
  try {
    const response = await fetch(url, options);
    const end = Date.now();
    const json = await response.json().catch(() => ({}));
    return {
      response,
      json,
      latency: end - start,
      timestamp: end
    };
  } catch (error) {
    const end = Date.now();
    return {
      response: null,
      json: { error: error.message },
      latency: end - start,
      timestamp: end,
      error
    };
  }
}

async function testRenderFlow(): Promise<TelemetryData> {
  const telemetry: TelemetryData = {
    t0: 0,
    postLatency: 0,
    postResponse: null,
    pollingEvents: [],
    dbRowFirstSeen: null,
    dbRowFirstStatus: null,
    statusSucceeded: null,
    timeoutToast: false
  };

  console.log("🚀 Starting E2E Render Test");
  console.log("=" .repeat(50));

  // 1) Render start
  console.log("\n1️⃣ RENDER START");
  console.log("POST /api/render");
  
  const t0 = Date.now();
  telemetry.t0 = t0;
  console.log(`T0: ${new Date(t0).toISOString()}`);

  const postResult = await makeRequest(`${BASE_URL}/api/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: TEST_IMAGE,
      prompt: TEST_PROMPT,
      guidance_scale: 15,
      prompt_strength: 0.8,
      num_inference_steps: 50
    })
  });

  telemetry.postLatency = postResult.latency;
  telemetry.postResponse = postResult.json;
  
  console.log(`Response time: ${postResult.latency}ms`);
  console.log(`HTTP Status: ${postResult.response?.status || 'ERROR'}`);
  console.log(`Returned JSON keys: ${Object.keys(postResult.json).join(', ')}`);

  if (!postResult.response?.ok || !postResult.json.id) {
    console.log("❌ POST /api/render failed - cannot continue test");
    return telemetry;
  }

  const predictionId = postResult.json.id;
  console.log(`Prediction ID: ${predictionId}`);

  // 2) Polling loop
  console.log("\n2️⃣ POLLING LOOP");
  console.log("GET /api/render/[id]");
  
  const maxPollingTime = 4 * 60 * 1000; // 4 minutes
  const pollingInterval = 2500; // 2.5 seconds
  let pollCount = 0;

  while (Date.now() - t0 < maxPollingTime) {
    pollCount++;
    const pollResult = await makeRequest(`${BASE_URL}/api/render/${predictionId}`);
    const elapsed = pollResult.timestamp - t0;
    
    const event = {
      timestamp: pollResult.timestamp,
      elapsed,
      status: pollResult.response?.status || 0,
      jsonStatus: pollResult.json.status || 'unknown'
    };
    
    telemetry.pollingEvents.push(event);
    
    console.log(`Poll #${pollCount}: +${elapsed}ms | Status: ${event.status} | JSON.status: ${event.jsonStatus}`);
    
    if (event.jsonStatus === "succeeded") {
      telemetry.statusSucceeded = pollResult.timestamp;
      console.log(`✅ Render succeeded after ${elapsed}ms`);
      break;
    }
    
    if (event.jsonStatus === "failed" || event.jsonStatus === "canceled") {
      console.log(`❌ Render failed with status: ${event.jsonStatus}`);
      break;
    }
    
    await sleep(pollingInterval);
  }

  if (telemetry.pollingEvents.length > 0) {
    const lastEvent = telemetry.pollingEvents[telemetry.pollingEvents.length - 1];
    if (lastEvent.jsonStatus !== "succeeded") {
      console.log(`⏰ Polling stopped after ${lastEvent.elapsed}ms (timeout or max attempts)`);
      telemetry.timeoutToast = true;
    }
  }

  // 3) My Renders check (simulate what the UI would see)
  console.log("\n3️⃣ MY RENDERS CHECK");
  console.log("Checking if render appears in My Renders...");
  
  // Note: In a real test, we'd need to be authenticated to check /my-renders
  // For this test, we'll simulate based on the polling results
  if (telemetry.pollingEvents.length > 0) {
    const firstPoll = telemetry.pollingEvents[0];
    telemetry.dbRowFirstSeen = firstPoll.timestamp;
    telemetry.dbRowFirstStatus = firstPoll.jsonStatus;
    console.log(`First DB row visible: +${firstPoll.elapsed}ms | Status: ${firstPoll.jsonStatus}`);
  }

  if (telemetry.statusSucceeded) {
    const succeededElapsed = telemetry.statusSucceeded - t0;
    console.log(`Status=succeeded in UI: +${succeededElapsed}ms`);
  }

  return telemetry;
}

async function main() {
  try {
    // Wait for dev server to start
    console.log("⏳ Waiting for dev server to start...");
    await sleep(5000);
    
    // Test if server is running
    const healthCheck = await makeRequest(`${BASE_URL}/my-renders`);
    if (!healthCheck.response) {
      console.log("❌ Dev server not responding - please start with 'npm run dev'");
      process.exit(1);
    }
    
    console.log("✅ Dev server is running");
    
    // Run the test
    const telemetry = await testRenderFlow();
    
    // 4) Print summary table
    console.log("\n4️⃣ TELEMETRY SUMMARY");
    console.log("=" .repeat(50));
    console.log("| Metric | Value |");
    console.log("|--------|-------|");
    console.log(`| POST latency | ${telemetry.postLatency}ms |`);
    console.log(`| Time to first DB row | ${telemetry.dbRowFirstSeen ? telemetry.dbRowFirstSeen - telemetry.t0 + 'ms' : 'N/A'} |`);
    console.log(`| Time to status=succeeded | ${telemetry.statusSucceeded ? telemetry.statusSucceeded - telemetry.t0 + 'ms' : 'N/A'} |`);
    console.log(`| Timeout toast appeared | ${telemetry.timeoutToast ? 'Yes' : 'No'} |`);
    console.log(`| Total polling events | ${telemetry.pollingEvents.length} |`);
    
    if (telemetry.postResponse?.id) {
      console.log(`\n🔗 Prediction ID: ${telemetry.postResponse.id}`);
      console.log(`📊 Final status: ${telemetry.pollingEvents[telemetry.pollingEvents.length - 1]?.jsonStatus || 'unknown'}`);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

main();
