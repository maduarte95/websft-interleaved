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
        <h3 className="text-lg font-semibold mb-4">Test Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        <ul className="text-sm space-y-1">
          <li><strong>Client Timestamp:</strong> Uses Date.now() - simple but may drift from server</li>
          <li><strong>Server Timestamp:</strong> Requests timestamp from server via callback - accurate but has latency</li>
          <li><strong>Stage Timer:</strong> Uses Empirica's useStageTimer hook - likely most synchronized</li>
          <li><strong>Adjusted Client:</strong> Client time adjusted by server offset - compromise approach</li>
          <li><strong>Test All Methods:</strong> Runs all tests simultaneously to compare synchronization</li>
        </ul>
      </div>
    </div>
  );
}