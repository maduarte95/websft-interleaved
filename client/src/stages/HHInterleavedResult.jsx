import React from 'react';
import { usePlayer, usePlayers, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function HHInterleavedResult() {
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const words = round.get("words") || [];

  const totalWordCount = words.length;
  const score = player.round.get("score") || 0; //both players' score corresponds to total word count

  function handleContinue() {
    player.stage.set("submit", true);
  }

  function getPlayerName(wordPlayerId) {
    return wordPlayerId === player.id ? "You" : "Partner";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-5xl font-bold mb-8">Interleaved Collaboration Summary</h1>
      <div className="w-full max-w-2xl">
        <h2 className="text-3xl font-bold mb-4">Words</h2>
        <ul className="list-disc list-inside grid grid-cols-2 gap-2">
          {words.map((word, index) => (
            <li key={index} className="text-xl">
              {getPlayerName(word.player)}: {word.text}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8">
        <h2 className="text-3xl font-bold mb-4">Collaboration Statistics</h2>
        <p className="text-xl">Total Words: {totalWordCount}</p>
        <p className="text-xl">Collaboration Score: {score}</p>
      </div>
      <Button handleClick={handleContinue} className="mt-8">Continue</Button>
    </div>
  );
}