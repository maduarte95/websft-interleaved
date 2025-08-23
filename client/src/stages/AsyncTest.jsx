import React, { useState } from "react";
import { usePlayer, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function AsyncTest() {
  const player = usePlayer();
  const stage = useStage();
  const [results, setResults] = useState([]);

  // Listen for test responses
  React.useEffect(() => {
    const response = player.stage.get("testResponse");
    if (response) {
      setResults(prev => [...prev, response]);
      // Clear the response so we can listen for new ones
      player.stage.set("testResponse", null);
    }
  }, [player.stage.get("testResponse")]);

  const triggerBlockingTest = () => {
    console.log(`[CLIENT] Player ${player.id} triggering BLOCKING test`);
    player.set("testTriggerBlocking", true);
  };

  const triggerNonBlockingTest = () => {
    console.log(`[CLIENT] Player ${player.id} triggering NON-BLOCKING test`);
    player.set("testTriggerNonBlocking", true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <h1 className="text-3xl font-bold mb-6">Async Callback Test</h1>
      <p className="text-lg mb-4">Player ID: {player.id}</p>
      <p className="text-md mb-6 text-gray-600">
        Test concurrent callback execution. Each test takes ~3 seconds.
      </p>

      <div className="flex gap-4 mb-8">
        <Button handleClick={triggerBlockingTest}>
          Test Blocking Pattern
        </Button>
        
        <Button handleClick={triggerNonBlockingTest}>
          Test Non-Blocking Pattern
        </Button>
      </div>

      <div className="w-full max-w-2xl">
        <h3 className="text-xl font-semibold mb-4">Test Results:</h3>
        <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-gray-500">No results yet. Trigger a test above.</p>
          ) : (
            results.map((result, index) => (
              <div key={index} className="mb-2 p-2 bg-white rounded">
                <strong>Player {result.playerId}:</strong> {result.response}
                <br />
                <small className="text-gray-500">
                  Time: {new Date(result.timestamp).toLocaleTimeString()}
                </small>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-100 rounded">
        <h4 className="font-semibold">Instructions:</h4>
        <ol className="list-decimal list-inside text-sm mt-2">
          <li>Open multiple browser tabs (different players)</li>
          <li>Test "Blocking Pattern" - click buttons at same time on both tabs</li>
          <li>Check server logs - Player 2 should wait for Player 1</li>
          <li>Test "Non-Blocking Pattern" - both should run concurrently</li>
          <li>Check timing logs in server console</li>
        </ol>
      </div>
    </div>
  );
}