import React, { useState } from "react";
import { Button } from "../components/Button";

export function MyPlayerForm({ onPlayerID, connecting }) {
  const [playerID, setPlayerID] = useState("");

  const handleSubmit = (evt) => {
    evt.preventDefault();
    if (!playerID || playerID.trim() === "") {
      return;
    }
    onPlayerID(playerID);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <div className="w-full max-w-xl px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Enter your Prolific ID
        </h1>
        
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <p className="text-gray-600 mb-4">
            Please enter your Prolific ID to participate in this study.
          </p>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <fieldset 
            disabled={connecting}
            className="space-y-4"
          >
            <div>
              <label 
                htmlFor="playerID" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prolific ID
              </label>
              <input
                id="playerID"
                name="playerID"
                type="text"
                autoComplete="off"
                required
                autoFocus
                value={playerID}
                onChange={(e) => setPlayerID(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-empirica-500 focus:border-empirica-500 sm:text-sm"
              />
            </div>

            <Button type="submit" className="w-full">
              {connecting ? "Loading..." : "Submit"}
            </Button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}