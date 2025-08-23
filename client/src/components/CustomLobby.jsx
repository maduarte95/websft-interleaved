import React, { useState, useEffect } from "react";
import { usePlayer, usePlayers, useGame } from "@empirica/core/player/classic/react";

export function CustomLobby() {
  const player = usePlayer();
  const players = usePlayers();
  const game = useGame();

  // 8-minute countdown timer (480 seconds)
  const [timeLeft, setTimeLeft] = useState(8 * 60); // 8 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!player) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Connecting...</p>
        </div>
      </div>
    );
  }

  const treatment = player.get("treatment");
  if (!treatment || !treatment.playerCount) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading game...</p>
        </div>
      </div>
    );
  }

  // For 2-person experiments, always show "waiting for 1 more participant"
  const currentPlayers = 1; // We know at least current player is here
  const expectedPlayers = 2;
  const playersNeeded = 1; // Always need 1 more for 2-person experiment

  return (
    <div className="flex h-full items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-lg">
        {/* Simple waiting icon */}
        <div className="mb-6">
          <div className="flex justify-center items-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
              className="mx-auto h-16 w-16 text-blue-500"
              stroke="none"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M544 224c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80zm0-128c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zM320 256c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm0-192c44.1 0 80 35.9 80 80s-35.9 80-80 80-80-35.9-80-80 35.9-80 80-80zm244 192h-40c-15.2 0-29.3 4.8-41.1 12.9 9.4 6.4 17.9 13.9 25.4 22.4 4.9-2.1 10.2-3.3 15.7-3.3h40c24.2 0 44 21.5 44 48 0 8.8 7.2 16 16 16s16-7.2 16-16c0-44.1-34.1-80-76-80zM96 224c44.2 0 80-35.8 80-80s-35.8-80-80-80-80 35.8-80 80 35.8 80 80 80zm0-128c26.5 0 48 21.5 48 48s-21.5 48-48 48-48-21.5-48-48 21.5-48 48-48zm304.1 180c-33.4 0-41.7 12-80.1 12-38.4 0-46.7-12-80.1-12-36.3 0-71.6 16.2-92.3 46.9-12.4 18.4-19.6 40.5-19.6 64.3V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-44.8c0-23.8-7.2-45.9-19.6-64.3-20.7-30.7-56-46.9-92.3-46.9zM480 432c0 8.8-7.2 16-16 16H176c-8.8 0-16-7.2-16-16v-44.8c0-16.6 4.9-32.7 14.1-46.4 13.8-20.5 38.4-32.8 65.7-32.8 27.4 0 37.2 12 80.2 12s52.8-12 80.1-12c27.3 0 51.9 12.3 65.7 32.8 9.2 13.7 14.1 29.8 14.1 46.4V432zM157.1 268.9c-11.9-8.1-26-12.9-41.1-12.9H76c-41.9 0-76 35.9-76 80 0 8.8 7.2 16 16 16s16-7.2 16-16c0-26.5 19.8-48 44-48h40c5.5 0 10.8 1.2 15.7 3.3 7.5-8.5 16.1-16 25.4-22.4z" />
            </svg>
          </div>
        </div>

        {/* Status message */}
        <div className="mb-6">
          {playersNeeded > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Waiting for Your Partner
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                We are waiting for <span className="font-semibold text-blue-600">another participant</span> to join.
              </p>
              
              {/* Countdown timer */}
              <div className="mt-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium text-blue-800">
                      Time remaining: <span className="font-bold text-blue-900">{formatTime(timeLeft)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-green-600 mb-3">
                All Participants Ready!
              </h2>
              <p className="text-lg text-gray-700 mb-2">
                Starting the experiment now...
              </p>
            </>
          )}
        </div>

        {/* Important instructions */}
        {playersNeeded > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Please Stay on This Page!
                </h3>
                <h3 className="text-sm font-semibold text-yellow-800 mb-1">
                  Other participants might arrive and start the experiment without a partner!
                </h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Do not close</strong> this browser tab or window </li>
                  <li>• <strong>Do not navigate away</strong> from this page</li>
                  <li>• <strong>Keep checking</strong> this page - the task will start as soon as all participants arrive!</li>
                  {/* <li>• <strong>Maximum wait time</strong>: {formatTime(timeLeft)} remaining</li> */}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Live status indicator */}
        <div className="flex items-center justify-center text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span>Live - checking for participants...</span>
        </div>

        {/* Additional encouragement */}
        {playersNeeded > 0 && (
          <div className="mt-6 text-sm text-gray-600">
            <p className="mb-2">Thank you for your patience!</p>
            <p>Other participants are joining the experiment right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}