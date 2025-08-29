import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useStage, useStageTimer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function TimestampTest() {
  const player = usePlayer();
  const stage = useStage();
  const timer = useStageTimer();
  
  const [logs, setLogs] = useState([]);
  const [clientTimeOffset, setClientTimeOffset] = useState(0);
  const logRef = useRef(null);
  
  // Get server start time
  const serverStartTime = stage.get("serverStartTime");
  
  // Calculate client time offset when component mounts
  useEffect(() => {
    if (serverStartTime) {
      const clientTime = Date.now();
      const offset = serverStartTime - clientTime;
      setClientTimeOffset(offset);
      
      addLog(`Component initialized`, {
        serverStartTime,
        clientTime,
        offset,
        stageTimerRemaining: timer?.remaining
      });
    }
  }, [serverStartTime]);
  
  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);
  
  function addLog(action, data) {
    const timestamp = Date.now();
    const logEntry = {
      id: Date.now() + Math.random(),
      action,
      timestamp,
      data: { ...data }
    };
    
    setLogs(prev => [...prev, logEntry]);
    console.log(`[TimestampTest] ${action}:`, data);
  }
  
  // Method 1: Client-side Date.now()
  function testClientTimestamp() {
    const clientNow = Date.now();
    const relativeToStart = serverStartTime ? clientNow - serverStartTime : null;
    
    addLog("Client Timestamp (Date.now())", {
      absoluteTimestamp: clientNow,
      relativeToServerStart: relativeToStart,
      method: "client-side"
    });
  }
  
  // Method 2: Server timestamp via callback
  async function testServerTimestamp() {
    try {
      addLog("Server Timestamp Request Started", { method: "server-callback" });
      
      // Clear existing timestamp
      await player.stage.set("serverTimestamp", undefined);
      
      // Set request flag
      await player.set("requestTimestamp", true);
      
      const startWait = Date.now();
      const timestamp = await getServerTimestamp();
      const endWait = Date.now();
      const waitTime = endWait - startWait;
      
      const relativeToStart = serverStartTime ? timestamp - serverStartTime : null;
      
      addLog("Server Timestamp Received", {
        absoluteTimestamp: timestamp,
        relativeToServerStart: relativeToStart,
        waitTime,
        method: "server-callback"
      });
      
    } catch (error) {
      addLog("Server Timestamp Error", {
        error: error.message,
        method: "server-callback"
      });
    }
  }
  
  // Method 3: Stage timer based timestamp
  function testStageTimerTimestamp() {
    if (!timer) {
      addLog("Stage Timer Error", {
        error: "Timer not available",
        method: "stage-timer"
      });
      return;
    }
    
    const timerRemaining = timer.remaining;
    const stageDuration = stage.get("duration") * 1000; // Convert to ms
    const elapsedTime = stageDuration - timerRemaining;
    
    // Calculate absolute timestamp based on stage start + elapsed time
    const calculatedAbsolute = serverStartTime + elapsedTime;
    
    addLog("Stage Timer Timestamp", {
      timerRemaining,
      stageDuration,
      elapsedTime,
      calculatedAbsolute,
      relativeToServerStart: elapsedTime,
      method: "stage-timer"
    });
  }
  
  // Method 4: Adjusted client timestamp
  function testAdjustedClientTimestamp() {
    const clientNow = Date.now();
    const adjustedTimestamp = clientNow + clientTimeOffset;
    const relativeToStart = serverStartTime ? adjustedTimestamp - serverStartTime : null;
    
    addLog("Adjusted Client Timestamp", {
      clientNow,
      clientTimeOffset,
      adjustedTimestamp,
      relativeToServerStart: relativeToStart,
      method: "adjusted-client"
    });
  }
  
  // Helper function for server timestamp
  async function getServerTimestamp() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50;
      
      const checkTimestamp = () => {
        attempts++;
        const timestamp = player.stage.get("serverTimestamp");
        
        if (timestamp) {
          resolve(timestamp);
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Failed to get timestamp after ${maxAttempts} attempts`));
        } else {
          setTimeout(checkTimestamp, 100);
        }
      };
      
      checkTimestamp();
    });
  }
  
  // Test API latency simulation (like AI word responses)
  async function testAPILatencySimulation() {
    const apiLatency = 2000 + Math.random() * 3000; // 2-5 second simulation
    addLog("API Latency Test Started", { simulatedLatency: apiLatency });
    
    // Record timestamps before "API call"
    const beforeClient = Date.now();
    const beforeStageTimer = timer ? (stage.get("duration") * 1000) - timer.remaining : null;
    const beforeServerTimestamp = await requestServerTimestamp();
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, apiLatency));
    
    // Record timestamps after "API call"
    const afterClient = Date.now();
    const afterStageTimer = timer ? (stage.get("duration") * 1000) - timer.remaining : null;
    const afterServerTimestamp = await requestServerTimestamp();
    
    // Calculate IRTs using different methods
    const clientIRT = afterClient - beforeClient;
    const stageTimerIRT = afterStageTimer - beforeStageTimer;
    const serverIRT = afterServerTimestamp - beforeServerTimestamp;
    
    addLog("API Latency Test Results", {
      simulatedLatency,
      clientIRT,
      stageTimerIRT,
      serverIRT,
      clientDiff: clientIRT - apiLatency,
      stageTimerDiff: stageTimerIRT - apiLatency,
      serverDiff: serverIRT - apiLatency,
      stageTimerVsClient: stageTimerIRT - clientIRT,
      stageTimerVsServer: stageTimerIRT - serverIRT
    });
  }
  
  // Helper to get server timestamp without modifying state
  async function requestServerTimestamp() {
    try {
      await player.stage.set("tempServerTimestamp", undefined);
      await player.set("requestTimestamp", true);
      
      let attempts = 0;
      while (attempts < 50) {
        const timestamp = player.stage.get("serverTimestamp");
        if (timestamp) {
          await player.stage.set("tempServerTimestamp", timestamp);
          return timestamp;
        }
        await new Promise(resolve => setTimeout(resolve, 50));
        attempts++;
      }
      throw new Error("Server timestamp timeout");
    } catch (error) {
      console.error("Server timestamp error:", error);
      return Date.now(); // Fallback to client time
    }
  }
  
  // Exact replica of VerbalFluencyCollab's getRelativeTimestamp
  function getVFRelativeTimestamp() {
    if (!timer) {
      throw new Error("Stage timer not available");
    }
    
    const stageDuration = stage.get("duration") * 1000; // Convert to ms
    const elapsedTime = stageDuration - timer.remaining;
    
    return Math.max(0, elapsedTime);
  }
  
  // Simple stage timer print
  function printStageTimer() {
    addLog("Stage Timer Values", {
      timerRemaining: timer?.remaining,
      timerAvailable: !!timer,
      stageDuration: stage.get("duration"),
      currentTime: Date.now(),
      serverStartTime: stage.get("serverStartTime")
    });
  }
  
  // Continuous VF-style timestamp monitoring
  function startVFTimestampMonitoring(duration = 30000) {
    addLog("=== VF TIMESTAMP MONITORING STARTED ===", { duration });
    
    let count = 0;
    const monitorInterval = setInterval(() => {
      count++;
      testVFTimestampMethod();
      
      if (count * 2000 >= duration) {
        clearInterval(monitorInterval);
        addLog("=== VF TIMESTAMP MONITORING ENDED ===", { totalTests: count });
      }
    }, 2000); // Test every 2 seconds
  }
  
  // Continuous drift monitoring
  async function startDriftMonitoring(duration = 30000) {
    addLog("=== DRIFT MONITORING STARTED ===", { duration });
    
    const startTime = Date.now();
    const stageDuration = stage.get("duration");
    const startTimerRemaining = timer?.remaining || 0;
    const startStageTimer = timer ? (stageDuration * 1000) - timer.remaining : 0;
    
    addLog("Initial Timer Values", {
      stageDuration,
      startTimerRemaining,
      startStageTimer,
      calculatedStart: stageDuration * 1000 - startTimerRemaining
    });
    
    let measurements = [];
    
      const monitorInterval = setInterval(async () => {
      const currentTime = Date.now();
      const currentTimerRemaining = timer?.remaining || 0;
      const currentStageTimer = timer ? (stageDuration * 1000) - timer.remaining : 0;
      
      const realElapsed = currentTime - startTime;
      const stageElapsed = currentStageTimer - startStageTimer;
      const timerElapsed = startTimerRemaining - currentTimerRemaining;
      const drift = stageElapsed - realElapsed;
      
      measurements.push({
        timestamp: currentTime,
        realElapsed,
        stageElapsed,
        timerElapsed,
        drift,
        driftPercentage: (drift / realElapsed) * 100,
        currentTimerRemaining,
        startTimerRemaining
      });
      
      // Log every 5 seconds with detailed timer info
      if (measurements.length % 5 === 0) {
        addLog(`Drift Check (${measurements.length * 1000}ms)`, {
          realElapsed,
          stageElapsed,
          timerElapsed,
          drift,
          driftPercentage: (drift / realElapsed) * 100,
          currentTimerRemaining,
          startTimerRemaining,
          timerDiff: startTimerRemaining - currentTimerRemaining
        });
      }
      
      if (currentTime - startTime >= duration) {
        clearInterval(monitorInterval);
        
        const totalDrift = measurements[measurements.length - 1].drift;
        const avgDrift = measurements.reduce((sum, m) => sum + m.drift, 0) / measurements.length;
        
        addLog("=== DRIFT MONITORING COMPLETE ===", {
          duration,
          totalMeasurements: measurements.length,
          totalDrift,
          avgDrift,
          finalDriftPercentage: (totalDrift / duration) * 100,
          finalTimerElapsed: measurements[measurements.length - 1].timerElapsed
        });
      }
    }, 1000);
  }
  
  // Test AI Response Timestamp using REAL server callback
  async function testAIResponseTimestamps() {
    addLog("=== REAL SERVER AI RESPONSE TIMESTAMP TEST START ===", {});
    
    try {
      // Clear any existing test response
      player.stage.set("testResponse", null);
      player.stage.set("testResponseError", null);
      
      addLog("Client: Triggering server test callback", {
        step: "trigger_server"
      });
      
      // Trigger the real server callback (like submitting a word triggers the AI callback)
      player.set("testTimestampRequest", Date.now());
      
      addLog("Client: Waiting for server response", {
        step: "waiting_for_server"
      });
      
      // Wait for server response (like waiting for apiResponse)
      const testResponse = await waitForTestResponse();
      
      if (!testResponse) {
        throw new Error("No test response received from server");
      }
      
      // Step: Capture client timestamp when processing response (like handleAIResponse)
      const clientTimestamp = Date.now();
      
      addLog("Client: Processing server response", {
        clientTimestamp,
        serverResponse: testResponse,
        step: "client_processing"
      });
      
      // Calculate the difference (this is where the anomaly appears)
      const serverTimestamp = testResponse.timestamp;
      const timestampDiff = clientTimestamp - serverTimestamp;
      const isAnomalous = timestampDiff < 0;
      
      // Create AI word object exactly like VerbalFluencyCollab.jsx:273-279
      const simulatedAIWord = {
        text: testResponse.text,
        source: 'ai',
        timestamp: serverTimestamp,    // From server response
        clientTimestamp,              // Captured on client
        delay: testResponse.delay
      };
      
      addLog("REAL AI Word Object Created", {
        simulatedAIWord,
        timestampComparison: {
          serverTimestamp,
          clientTimestamp,
          serverEarlier: serverTimestamp < clientTimestamp,
          clientEarlier: clientTimestamp < serverTimestamp,
          difference: timestampDiff,
          isAnomalous,
          anomalyType: isAnomalous ? 'CLIENT_EARLIER_THAN_SERVER' : 'NORMAL'
        },
        step: "word_object_created"
      });
      
      // Clear the test response
      player.stage.set("testResponse", null);
      
    } catch (error) {
      addLog("Real Server Test Error", {
        error: error.message
      });
    }
    
    addLog("=== REAL SERVER AI RESPONSE TIMESTAMP TEST END ===", {});
  }
  
  // Helper function to wait for server test response
  async function waitForTestResponse() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 30; // 15 seconds timeout
      
      const checkResponse = () => {
        attempts++;
        const testResponse = player.stage.get("testResponse");
        const testError = player.stage.get("testResponseError");
        
        if (testError) {
          reject(new Error(testError.error));
        } else if (testResponse) {
          resolve(testResponse);
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Timeout waiting for server test response after ${maxAttempts * 500}ms`));
        } else {
          setTimeout(checkResponse, 500);
        }
      };
      
      checkResponse();
    });
  }
  
  // Test multiple REAL server AI responses in sequence
  async function testSequentialAIResponses(count = 5) {
    addLog(`=== SEQUENTIAL REAL SERVER AI RESPONSES TEST (${count} responses) ===`, {});
    
    const results = [];
    
    for (let i = 0; i < count; i++) {
      try {
        // Clear previous responses
        player.stage.set("testResponse", null);
        player.stage.set("testResponseError", null);
        
        // Trigger real server callback
        player.set("testTimestampRequest", Date.now());
        
        // Wait for server response
        const testResponse = await waitForTestResponse();
        
        // Capture client timestamp (like handleAIResponse does)
        const clientTime = Date.now();
        const serverTime = testResponse.timestamp;
        const diff = clientTime - serverTime;
        const isAnomalous = diff < 0;
        
        const result = {
          iteration: i + 1,
          serverTime,
          clientTime,
          diff,
          serverDelay: testResponse.delay,
          isAnomalous,
          anomalyType: isAnomalous ? 'CLIENT_EARLIER_THAN_SERVER' : 'NORMAL'
        };
        
        results.push(result);
        
        addLog(`Real Server AI Response ${i + 1}/${count}`, result);
        
        // Small delay between tests to avoid overwhelming server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        addLog(`Error in iteration ${i + 1}`, {
          iteration: i + 1,
          error: error.message
        });
      }
    }
    
    const anomalousCount = results.filter(r => r.isAnomalous).length;
    const avgDiff = results.reduce((sum, r) => sum + r.diff, 0) / results.length;
    const minDiff = Math.min(...results.map(r => r.diff));
    const maxDiff = Math.max(...results.map(r => r.diff));
    const avgServerDelay = results.reduce((sum, r) => sum + r.serverDelay, 0) / results.length;
    
    addLog("REAL Sequential Test Summary", {
      totalResponses: results.length,
      anomalousResponses: anomalousCount,
      anomalousPercentage: (anomalousCount / results.length) * 100,
      avgTimestampDiff: avgDiff,
      minTimestampDiff: minDiff,
      maxTimestampDiff: maxDiff,
      avgServerDelay,
      anomalousCases: results.filter(r => r.isAnomalous)
    });
    
    addLog(`=== SEQUENTIAL REAL SERVER AI RESPONSES TEST END ===`, {});
  }

  // Test all methods simultaneously
  async function testAllMethods() {
    addLog("=== SIMULTANEOUS TEST START ===", {});
    
    // Record start time for synchronization
    const testStartTime = Date.now();
    
    // Test all methods
    testClientTimestamp();
    testStageTimerTimestamp();
    testAdjustedClientTimestamp();
    await testServerTimestamp(); // This one has async delay
    
    const testEndTime = Date.now();
    const totalTestTime = testEndTime - testStartTime;
    
    addLog("=== SIMULTANEOUS TEST END ===", {
      totalTestTime,
      testStartTime,
      testEndTime
    });
  }
  
  function clearLogs() {
    setLogs([]);
  }
  
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="flex flex-col items-center justify-start h-full p-6">
      <h2 className="text-3xl font-bold mb-6">Timestamp Synchronization Test</h2>
      
      {/* Stage Info */}
      <div className="w-full max-w-6xl bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Stage Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Server Start Time:</strong> {serverStartTime}
          </div>
          <div>
            <strong>Client Time Offset:</strong> {clientTimeOffset}ms
          </div>
          <div>
            <strong>Timer Remaining:</strong> {timer?.remaining || 'N/A'}ms
          </div>
          <div>
            <strong>Stage Duration:</strong> {stage.get("duration")}s
          </div>
        </div>
      </div>
      
      {/* Test Controls */}
      <div className="w-full max-w-6xl mb-6">
        <h3 className="text-lg font-semibold mb-4">Basic Test Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Button handleClick={testClientTimestamp}>
            Test Client Timestamp
          </Button>
          <Button handleClick={testServerTimestamp}>
            Test Server Timestamp
          </Button>
          <Button handleClick={testStageTimerTimestamp}>
            Test Stage Timer
          </Button>
          <Button handleClick={testAdjustedClientTimestamp}>
            Test Adjusted Client
          </Button>
          <Button handleClick={testAllMethods}>
            Test All Methods
          </Button>
          <Button handleClick={clearLogs}>
            Clear Logs
          </Button>
        </div>
        
        <h3 className="text-lg font-semibold mb-4">Real Server AI Word Timestamp Tests</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Button handleClick={testAIResponseTimestamps}>
            Test Real Server AI Response
          </Button>
          <Button handleClick={() => testSequentialAIResponses(10)}>
            Test 10 Real Server Responses
          </Button>
          <Button handleClick={() => testSequentialAIResponses(50)}>
            Test 50 Real Server Responses
          </Button>
        </div>
        
        <h3 className="text-lg font-semibold mb-4">Advanced Investigation Tools</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button handleClick={printStageTimer}>
            Print Stage Timer
          </Button>
          <Button handleClick={testAPILatencySimulation}>
            Simulate API Latency
          </Button>
          <Button handleClick={() => startVFTimestampMonitoring(30000)}>
            Monitor VF (30s)
          </Button>
          <Button handleClick={() => startDriftMonitoring(15000)}>
            Monitor Drift (15s)
          </Button>
        </div>
      </div>
      
      {/* Log Display */}
      <div className="w-full max-w-6xl bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Test Results ({logs.length} entries)</h3>
        </div>
        <div 
          ref={logRef}
          className="h-96 overflow-y-auto p-4 font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No test results yet. Click a test button above to start.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="mb-4 p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start mb-2">
                  <strong className="text-blue-600">{log.action}</strong>
                  <span className="text-gray-500 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}.{log.timestamp % 1000}
                  </span>
                </div>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(log.data, null, 2)}
                </pre>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="w-full max-w-6xl mt-6 bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-2">Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">Basic Tests:</h4>
            <ul className="text-sm space-y-1">
              <li><strong>Client Timestamp:</strong> Uses Date.now() - simple but may drift from server</li>
              <li><strong>Server Timestamp:</strong> Requests timestamp from server via callback - accurate but has latency</li>
              <li><strong>Stage Timer:</strong> Uses Empirica's useStageTimer hook - synchronized to stage</li>
              <li><strong>Adjusted Client:</strong> Client time adjusted by server offset - compromise approach</li>
              <li><strong>Test All Methods:</strong> Runs all tests simultaneously to compare synchronization</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">AI Word Timestamp Tests:</h4>
            <ul className="text-sm space-y-1">
              <li><strong>Test AI Response Timing:</strong> Simulates the exact AI word timestamp flow to reproduce anomalies</li>
              <li><strong>Sequential AI Responses:</strong> Tests multiple AI responses in sequence to detect timing patterns</li>
              <li><strong>Key Check:</strong> Look for isAnomalous=true cases where clientTimestamp &lt; serverTimestamp</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Investigation Tools:</h4>
            <ul className="text-sm space-y-1">
              <li><strong>Simulate API Latency:</strong> Mimics AI word response timing - compares IRT calculations across methods</li>
              <li><strong>Monitor Drift (15s):</strong> Continuously compares stage timer vs real time to detect drift</li>
              <li><strong>Key Metrics:</strong> Look for drift percentage, stageTimerVsClient, and stageTimerVsServer differences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}