import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useStage, useStageTimer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function TimestampTestRealTiming() {
  const player = usePlayer();
  const stage = useStage();
  const timer = useStageTimer();
  
  const [logs, setLogs] = useState([]);
  const [isWaitingForTest, setIsWaitingForTest] = useState(false);
  const logRef = useRef(null);
  
  // Get server start time
  const serverStartTime = stage.get("serverStartTime");
  
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
  
  // EXACT REPLICA of VerbalFluencyCollab useEffect pattern
  useEffect(() => {
    const testResponse = player.stage.get("testResponse");
    addLog("useEffect: testResponse changed", {
      testResponse: testResponse ? { 
        text: testResponse.text, 
        timestamp: testResponse.timestamp,
        delay: testResponse.delay 
      } : null,
      isWaitingForTest,
      effectTriggerTime: Date.now(),
      step: "useEffect_triggered"
    });
    
    if (testResponse && isWaitingForTest) {
      addLog("useEffect: Processing testResponse", {
        step: "useEffect_processing_start",
        processingStartTime: Date.now()
      });
      
      handleTestResponse(testResponse);
    }
  }, [player.stage.get("testResponse"), isWaitingForTest]);
  
  // EXACT REPLICA of handleAIResponse timing
  function handleTestResponse(testResponse) {
    addLog("handleTestResponse: Called", {
      responseReceived: {
        text: testResponse.text,
        timestamp: testResponse.timestamp,
        delay: testResponse.delay
      },
      step: "handle_test_response_start",
      functionCallTime: Date.now()
    });
    
    // Capture client timestamp immediately (like real handleAIResponse)
    const clientTimestamp = Date.now();
    
    addLog("handleTestResponse: Client timestamp captured", {
      clientTimestamp,
      serverTimestamp: testResponse.timestamp,
      step: "client_timestamp_captured",
      captureTime: clientTimestamp
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
    
    addLog("EXACT TIMING AI Word Object Created", {
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
      step: "word_object_created",
      wordCreationTime: Date.now()
    });
    
    // Clear the test response (like real handleAIResponse)
    addLog("handleTestResponse: Clearing testResponse", {
      step: "clearing_test_response",
      clearingTime: Date.now()
    });
    
    player.stage.set("testResponse", null);  // This will trigger useEffect again!
    setIsWaitingForTest(false);
    
    addLog("handleTestResponse: Complete", {
      step: "handle_test_response_complete",
      completionTime: Date.now()
    });
  }
  
  // Test using exact VerbalFluencyCollab timing strategy
  async function testExactTimingPattern() {
    addLog("=== EXACT TIMING PATTERN TEST START ===", {
      testStartTime: Date.now()
    });
    
    try {
      // Clear any existing test response and reset state
      addLog("Test: Clearing previous state", {
        step: "clearing_previous_state",
        clearTime: Date.now()
      });
      
      player.stage.set("testResponse", null);
      player.stage.set("testResponseError", null);
      setIsWaitingForTest(false);
      
      // Small delay to ensure clearing is processed
      await new Promise(resolve => setTimeout(resolve, 50));
      
      addLog("Test: Setting waiting state", {
        step: "setting_waiting_state",
        setTime: Date.now()
      });
      
      setIsWaitingForTest(true);
      
      addLog("Test: Triggering server callback", {
        step: "trigger_server",
        triggerTime: Date.now()
      });
      
      // Trigger the real server callback (like submitting a word triggers the AI callback)
      player.set("testTimestampRequest", Date.now());
      
      addLog("Test: Server callback triggered, relying on useEffect", {
        step: "waiting_for_useEffect",
        waitStartTime: Date.now()
      });
      
      // Note: We don't await anything here - the useEffect will handle the response
      
    } catch (error) {
      addLog("Exact Timing Test Error", {
        error: error.message,
        errorTime: Date.now()
      });
      setIsWaitingForTest(false);
    }
    
    addLog("=== EXACT TIMING PATTERN TEST INITIATED ===", {
      testInitiatedTime: Date.now()
    });
  }
  
  // Test multiple responses in sequence using exact timing
  async function testSequentialExactTiming(count = 10) {
    addLog(`=== SEQUENTIAL EXACT TIMING TEST (${count} responses) ===`, {
      sequenceStartTime: Date.now()
    });
    
    for (let i = 0; i < count; i++) {
      try {
        addLog(`Starting test ${i + 1}/${count}`, {
          iteration: i + 1,
          iterationStartTime: Date.now()
        });
        
        await testExactTimingPattern();
        
        // Wait a bit between tests to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        addLog(`Error in test ${i + 1}`, {
          iteration: i + 1,
          error: error.message,
          errorTime: Date.now()
        });
      }
    }
    
    addLog(`=== SEQUENTIAL EXACT TIMING TEST COMPLETE ===`, {
      sequenceEndTime: Date.now()
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
      <h2 className="text-3xl font-bold mb-6">Exact Timing Pattern Test</h2>
      
      {/* Stage Info */}
      <div className="w-full max-w-6xl bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold mb-2">Test Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Server Start Time:</strong> {serverStartTime}
          </div>
          <div>
            <strong>Waiting for Test:</strong> {isWaitingForTest ? 'YES' : 'NO'}
          </div>
          <div>
            <strong>Current Time:</strong> {Date.now()}
          </div>
          <div>
            <strong>Stage Duration:</strong> {stage.get("duration")}s
          </div>
        </div>
      </div>
      
      {/* Test Controls */}
      <div className="w-full max-w-6xl mb-6">
        <h3 className="text-lg font-semibold mb-4">Exact Timing Tests</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Button handleClick={testExactTimingPattern}>
            Single Test (Exact Timing)
          </Button>
          <Button handleClick={() => testSequentialExactTiming(10)}>
            Test 10 Sequential
          </Button>
          <Button handleClick={() => testSequentialExactTiming(25)}>
            Test 25 Sequential  
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
        <h3 className="text-lg font-semibold mb-2">Exact Timing Pattern</h3>
        <div className="text-sm">
          <p><strong>This test replicates exactly how VerbalFluencyCollab handles AI responses:</strong></p>
          <ul className="list-disc ml-4 mt-2 space-y-1">
            <li>Uses <code>useEffect</code> watching <code>player.stage.get("testResponse")</code></li>
            <li>Captures <code>clientTimestamp = Date.now()</code> immediately in handler</li>
            <li>Clears <code>testResponse</code> after processing (triggers useEffect again)</li>
            <li>All timing logged with microsecond precision</li>
            <li>Look for <strong>isAnomalous=true</strong> cases where client &lt; server timestamps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}