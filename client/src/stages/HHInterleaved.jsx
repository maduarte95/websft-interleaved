import React, { useState, useEffect, useRef } from "react";
import { usePlayer, usePlayers, useRound, useStage } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { TimeProgressBar } from "../components/TimeProgressBar";

export function HHInterleaved() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const player = usePlayer();
  const players = usePlayers();
  const round = useRound();
  const otherPlayer = players.find(p => p.id !== player.id);
  const isPlayerTurn = round.get("currentTurnPlayerId") === player.id;
  const stage = useStage();
  const category = player.round.get("category");
  player.round.set("roundName", "InterleavedHH");
  const inputRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const wordHistoryRef = useRef(null);

  //State variable for progress bar
  const [showProgressBar, setShowProgressBar] = useState(false);

  // Text normalization function
  const normalizeString = (str) => {
    return str.trim().toLowerCase().replace(/[\s\-',.]+/g, ''); // Remove spaces, hyphens, apostrophes, commas, periods and convert to lowercase
  };
  
  //Wait for serverStartTime before rendering interactive elements
  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  // Add an effect to handle turn changes for progress bar
  useEffect(() => {
  // When the turn changes to this player, start the progress bar
    if (round.get("currentTurnPlayerId") === player.id) {
      setShowProgressBar(true);
    } else {
      setShowProgressBar(false);
    }
  }, [round.get("currentTurnPlayerId")]);

  // Add effect to scroll to the bottom of word history
  useEffect(() => {
    if (wordHistoryRef.current) {
      wordHistoryRef.current.scrollTop = wordHistoryRef.current.scrollHeight;
    }
  }, [round.get("words")]);

  // Focus input when it's the player's turn and input is available
  useEffect(() => {
    if (isPlayerTurn && inputRef.current && !isSubmittingRef.current) {
      inputRef.current.focus();
    }
  }, [isPlayerTurn]);

  //logging - Track component lifecycle
  useEffect(() => {
    console.log('HHInterleaved mounted:', {
      currentTurnPlayerId: round.get("currentTurnPlayerId"),
      myId: player.id,
      words: round.get("words"),
      timestamp: Date.now()
    });
  }, []);
    
  // logging - Track changes to currentTurnPlayerId
  useEffect(() => {
    console.log(`[Player ${player.id}] Turn state changed:`, {
      currentTurnPlayerId: round.get("currentTurnPlayerId"),
      isPlayerTurn: round.get("currentTurnPlayerId") === player.id,
      wordCount: (round.get("words") || []).length,
      timestamp: Date.now()
    });
  }, [round.get("currentTurnPlayerId")]);

  // logging - Track server timestamp changes
  useEffect(() => {
    const timestamp = player.stage.get("serverTimestamp");
    console.log(`[Player ${player.id}] Timestamp changed:`, timestamp);
  }, [player.stage.get("serverTimestamp")]);
  
  // Update word display and score when words change
  useEffect(() => {
    const words = round.get("words") || [];
    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      const wordOwner = lastSavedWord.player === player.id ? "You" : "Partner";
      setLastWord(`${wordOwner}: ${lastSavedWord.text}`);
    }
    player.round.set("score", words.length); //set both players' score to total word count  
  }, [round.get("words"), player.id]); 


  async function getServerTimestamp() {
    console.log(`[Player ${player.id}] Requesting server timestamp for stage ${stage.get("name")}`);
    
    // Clear existing timestamp
    player.stage.set("serverTimestamp", undefined);
    console.log(`[Player ${player.id}] Cleared existing timestamp`);
    
    // Set request flag for server timestamp
    player.set("requestTimestamp", true);
    console.log(`[Player ${player.id}] Set request flag`);
  
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const checkTimestamp = () => {
        attempts++;
        const timestamp = player.stage.get("serverTimestamp");
        console.log(`[Player ${player.id}] Check attempt ${attempts}: timestamp=${timestamp}`);
        
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


  async function handleSendWord() {
    // Initial validation with refs for synchronous checks
    if (currentWord.trim() === "" || !isPlayerTurn || isSubmittingRef.current) {
      return;
    }
    
    // Immediately lock submissions and capture word
    isSubmittingRef.current = true;
    const wordToSubmit = currentWord.trim();
    setCurrentWord(""); // Clear input immediately

  
    try {
      // Check for duplicates before proceeding
      const words = round.get("words") || [];
      const normalizedWordToSubmit = normalizeString(wordToSubmit);
      const isDuplicate = words.some(w => 
        normalizeString(w.text) === normalizedWordToSubmit
      );
  
      if (isDuplicate) {
        console.log(`[Player ${player.id}] Duplicate word rejected: ${wordToSubmit}`);
        setLastWord(`"${wordToSubmit}" was already used!`);
        // Reset progress bar on duplicate rejection if it's player's turn
        if (isPlayerTurn) {
          setShowProgressBar(false);
          setTimeout(() => setShowProgressBar(true), 10);
        }
        return;
      }
  
      console.log(`[Player ${player.id}] Starting word submission`);
  
      const timestamp = await getServerTimestamp();
      if (!timestamp) {
        throw new Error("No server timestamp received");
      }
  
      console.log(`[Player ${player.id}] Got timestamp from server: ${timestamp}`);
      
      if (!serverStartTime) {
        throw new Error("No server start time available");
      }
  
      const relativeTimestamp = timestamp - serverStartTime;
      if (relativeTimestamp < 0) {
        throw new Error(`Invalid relative timestamp: ${relativeTimestamp}`);
      }
  
      // Verify it's still our turn before submitting
      if (round.get("currentTurnPlayerId") !== player.id) {
        throw new Error("Turn changed during submission");
      }

      // Check for slow response
      if (words.length > 0) {
        const lastWord = words[words.length - 1];
        const responseDelay = relativeTimestamp - lastWord.timestamp;
        if (responseDelay > 20000) { // 10 seconds in milliseconds -> 20s
          //   const currentPenalties = player.get("slowResponsePenalties") || 0;
          //   player.set("slowResponsePenalties", currentPenalties + 1);
          //   console.log(`Slow response penalty applied: ${responseDelay}ms`);
          // }
          const delayPoints = Math.floor(responseDelay / 20000);
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + delayPoints);
          console.log(`Slow response penalty applied: ${delayPoints} penalties`);
        }
      }
      //add penalty for slow first word too
      if (words.length === 0) {
        const responseDelay = relativeTimestamp;
        if (responseDelay > 20000) { // 10 seconds in milliseconds -> 20s
          const delayPoints = Math.floor(responseDelay / 20000);
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + delayPoints);
          console.log(`Slow response penalty applied to first word: ${delayPoints} penalties`);
        }
      }

      // Reset the progress bar and add word to list 
      setShowProgressBar(false);
  
      const updatedWords = [...words, {
        text: wordToSubmit,
        player: player.id,
        timestamp: relativeTimestamp,
        absoluteTimestamp: timestamp,
      }];
  
      // Atomic updates - update words and change turn together
      await Promise.all([
        round.set("words", updatedWords),
        round.set("currentTurnPlayerId", otherPlayer.id)
      ]);
  
      console.log(`[Player ${player.id}] Word submission complete:`, {
        word: wordToSubmit,
        //timestamp,
        relativeTimestamp,
        newTurn: otherPlayer.id
      });

      console.log("Updated words:", updatedWords);
  
    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
      // Reset progress bar on submission failure if it's player's turn
      if (isPlayerTurn) {
        setShowProgressBar(false);
        setTimeout(() => setShowProgressBar(true), 10);
      }
      // On error, restore the word to input if it wasn't a duplicate - ???
      if (wordToSubmit && !words?.some(w => normalizeString(w.text) === normalizeString(wordToSubmit))) {
        setCurrentWord(wordToSubmit);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-6">Name as many items as you can: {category}</h2>
      
      <div className="w-full max-w-4xl flex mb-8">
        {/* Left side - Word History */}
        <div className="w-1/3 bg-gray-50 rounded-l-lg shadow-md p-4 border-r border-gray-200">
          <div className="text-sm uppercase tracking-wide text-gray-500 mb-2 text-center font-semibold">
            Word History
          </div>
          <div 
            ref={wordHistoryRef}
            className="h-72 overflow-y-auto px-2"
          >
            {(round.get("words") || []).map((word, index) => (
              <div key={index} className="mb-3 pb-2 border-b border-gray-100">
                <span className={`text-sm font-medium ${word.player === player.id ? 'text-slate-600' : 'text-slate-800'}`}>
                  {word.player === player.id ? 'You' : 'Partner'}:
                </span>
                <span className={`block text-lg ${word.player === player.id ? 'text-slate-600' : 'text-slate-800'}`}>
                  {word.text}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right side - Current word and input */}
        <div className="w-2/3 bg-gray-50 rounded-r-lg shadow-md p-6">
          <div className="text-center">
            {lastWord ? (
              <div className="flex flex-col items-center mb-6">
                <div className="text-sm uppercase tracking-wide text-gray-500 mb-1">
                  {lastWord.startsWith('You:') ? 'Your last word' : 'Partner\'s last word'}
                </div>
                <div className={`text-4xl font-bold ${lastWord.startsWith('You:') ? 'text-slate-600' : 'text-slate-800'}`}>
                  {lastWord.replace(/^(You:|Partner:)\s/, '')}
                </div>
              </div>
            ) : (
              <div className="text-2xl text-gray-600 mb-6">No words yet - name an item!</div>
            )}
          </div>
          
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <input
                ref={inputRef}
                value={currentWord}
                onChange={(e) => setCurrentWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.repeat) {
                    e.preventDefault();
                    handleSendWord();
                  }
                }}
                placeholder="Enter an item..."
                className={`flex-grow p-3 text-lg border rounded-l-lg focus:outline-none focus:ring-2 ${
                  !isPlayerTurn || isSubmittingRef.current
                    ? 'bg-gray-100 border-gray-300 text-gray-500'
                    : 'border-blue-300 focus:ring-blue-500'
                }`}
                disabled={!isPlayerTurn || isSubmittingRef.current}
                autoFocus={isPlayerTurn}
              />
              <Button 
                handleClick={handleSendWord} 
                disabled={
                  !isPlayerTurn || 
                  isSubmittingRef.current || 
                  currentWord.trim() === ""
                }
              >
                Send
              </Button>
            </div>

            {showProgressBar && isPlayerTurn && (
              <TimeProgressBar isActive={showProgressBar && isPlayerTurn} />
            )}
            
            <div className="text-center mt-4">
              {!isPlayerTurn ? (
                <p className="text-lg font-medium text-gray-600">Waiting for your partner...</p>
              ) : (
                <p className="text-lg font-medium text-emerald-600">It's your turn!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
