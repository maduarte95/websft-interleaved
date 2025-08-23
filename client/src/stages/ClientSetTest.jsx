import React, { useState } from "react";
import { usePlayer, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function ClientSetTest() {
  const player = usePlayer();
  const round = useRound();
  const [logs, setLogs] = useState([]);
  const [counter, setCounter] = useState(0);

  const addLog = (message) => {
    const timestamp = Date.now();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const testSyncSet = () => {
    addLog("Starting sync set test");
    
    const startTime = Date.now();
    const result1 = player.set("testValue1", `sync_${counter}`);
    const midTime = Date.now();
    const result2 = round.set("testValue2", `sync_${counter}`);
    const endTime = Date.now();
    
    addLog(`Sync set results: player.set returned ${typeof result1} (${result1}), round.set returned ${typeof result2} (${result2})`);
    addLog(`Sync timing: player.set took ${midTime - startTime}ms, round.set took ${endTime - midTime}ms`);
    
    setCounter(prev => prev + 1);
  };

  const testAwaitSet = async () => {
    addLog("Starting await set test");
    
    try {
      const startTime = Date.now();
      const result1 = await player.set("testValue1", `await_${counter}`);
      const midTime = Date.now();
      const result2 = await round.set("testValue2", `await_${counter}`);
      const endTime = Date.now();
      
      addLog(`Await set results: player.set returned ${typeof result1} (${result1}), round.set returned ${typeof result2} (${result2})`);
      addLog(`Await timing: player.set took ${midTime - startTime}ms, round.set took ${endTime - midTime}ms`);
    } catch (error) {
      addLog(`Await set error: ${error.message}`);
    }
    
    setCounter(prev => prev + 1);
  };

  const testPromiseAll = async () => {
    addLog("Starting Promise.all test");
    
    try {
      const startTime = Date.now();
      const results = await Promise.all([
        player.set("testValue1", `promise_${counter}`),
        round.set("testValue2", `promise_${counter}`),
        player.round.set("testValue3", `promise_${counter}`)
      ]);
      const endTime = Date.now();
      
      addLog(`Promise.all results: [${results.map(r => `${typeof r}(${r})`).join(', ')}]`);
      addLog(`Promise.all timing: took ${endTime - startTime}ms total`);
    } catch (error) {
      addLog(`Promise.all error: ${error.message}`);
    }
    
    setCounter(prev => prev + 1);
  };

  const testReadback = () => {
    addLog("Reading back values:");
    addLog(`player.get("testValue1"): ${player.get("testValue1")}`);
    addLog(`round.get("testValue2"): ${round.get("testValue2")}`);
    addLog(`player.round.get("testValue3"): ${player.round.get("testValue3")}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold mb-6">Client Set Behavior Test</h1>
      <p className="text-lg mb-4">Player ID: {player.id}</p>
      
      <div className="flex gap-4 mb-6">
        <Button handleClick={testSyncSet}>
          Test Sync Set
        </Button>
        
        <Button handleClick={testAwaitSet}>
          Test Await Set
        </Button>
        
        <Button handleClick={testPromiseAll}>
          Test Promise.all
        </Button>
        
        <Button handleClick={testReadback}>
          Read Values
        </Button>
        
        <Button handleClick={clearLogs}>
          Clear Logs
        </Button>
      </div>

      <div className="w-full max-w-4xl">
        <h3 className="text-xl font-semibold mb-4">Test Results:</h3>
        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a test button above.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 text-sm font-mono">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-100 rounded">
        <h4 className="font-semibold">What we're testing:</h4>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>Return type and value of .set() operations</li>
          <li>Timing differences between sync/await/Promise.all</li>
          <li>Whether await actually waits for anything</li>
          <li>Whether Promise.all provides any benefit</li>
        </ul>
      </div>
    </div>
  );
}