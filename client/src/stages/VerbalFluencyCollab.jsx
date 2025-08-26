import React, { useState, useEffect, useRef } from "react";
import { usePlayer, useRound, useStage, useStageTimer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { TimeProgressBar } from "../components/TimeProgressBar";

export function VerbalFluencyCollab() {
  const [currentWord, setCurrentWord] = useState("");
  const [lastWord, setLastWord] = useState("");
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);
  const player = usePlayer();
  const round = useRound();
  const stage = useStage();
  const timer = useStageTimer();
  const category = player.round.get("category");
  const inputRef = useRef(null);
  const wordHistoryRef = useRef(null);

  //states for the bar
  const [showProgressBar, setShowProgressBar] = useState(false);
  
  const [apiError, setApiError] = useState(null);
  
  // Simple debounce to prevent rapid clicks
  const [isSubmitting, setIsSubmitting] = useState(false);
  const debounceTimeoutRef = useRef(null);

  // Text normalization function
  const normalizeString = (str) => {
    return str.trim().toLowerCase().replace(/[\s\-',.]+/g, ''); // Remove spaces, hyphens, apostrophes, commas, periods and convert to lowercase
  };
  
  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);
  
  // Wait for serverStartTime before rendering interactive elements
  const serverStartTime = stage.get("serverStartTime");
  if (!serverStartTime) {
    return <div>Loading...</div>;
  }

  // Add effect to scroll to the bottom of word history
  useEffect(() => {
    if (wordHistoryRef.current) {
      wordHistoryRef.current.scrollTop = wordHistoryRef.current.scrollHeight;
    }
  }, [player.round.get("words")]);
  
  // Get a timestamp relative to stage start using stage timer
  function getRelativeTimestamp() {
    if (!timer) {
      throw new Error("Stage timer not available");
    }
    
    const stageDuration = stage.get("duration") * 1000; // Convert to ms
    const elapsedTime = stageDuration - timer.remaining;
    
    return Math.max(0, elapsedTime);
  }

  //Show progress bar in first render
  useEffect(() => {
    setShowProgressBar(true);
  }, []);

  useEffect(() => {
    // When isWaitingForAI becomes false, focus the input
    if (!isWaitingForAI && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isWaitingForAI]);  

  useEffect(() => {
    player.round.set("roundName", "InterleavedLLM");
    console.log(`[VerbalFluencyCollab] Player ${player.id} component mounted`);
    
    // Simple turn state check - robust to page refresh
    const apiInProgress = player.get("apiTrigger");
    
    if (apiInProgress) {
      console.log(`[Turn State] Player ${player.id} waiting for API response`);
      setIsWaitingForAI(true);
      setShowProgressBar(false);
    } else {
      console.log(`[Turn State] Player ${player.id} user's turn`);
      setIsWaitingForAI(false);
      setShowProgressBar(true);
    }
  }, []);

  useEffect(() => {
    const words = player.round.get("words") || [];
    const totalWordCount = words.length;
    player.round.set("score", totalWordCount);

    const lastSavedWord = words[words.length - 1];
    if (lastSavedWord) {
      setLastWord(`${lastSavedWord.source === 'user' ? 'You' : 'Partner'}: ${lastSavedWord.text}`);
    }
  }, [player.round.get("words")]);

  useEffect(() => {
    const response = player.stage.get("apiResponse");
    if (response && isWaitingForAI) {
      handleAIResponse(response);
    }
  }, [player.stage.get("apiResponse")]);

  // Monitor API errors and reset turn to user
  useEffect(() => {
    const error = player.stage.get("apiError");
    if (error && isWaitingForAI) {
      console.log(`[API Error] Player ${player.id}:`, error);
      setApiError({
        message: "Something went wrong. Please try again.",
        type: error.type || "UNKNOWN"
      });
      
      // Reset to user's turn on error
      setIsWaitingForAI(false);
      setShowProgressBar(true);
      player.set("apiTrigger", false);
      
      // Clear error after 5 seconds
      setTimeout(() => setApiError(null), 5000);
    }
  }, [player.stage.get("apiError")]);
  function handleSendWord() {
    const wordToSubmit = currentWord.trim();
    
    // Prevent rapid clicks and empty submissions
    if (!wordToSubmit || isWaitingForAI || isSubmitting) {
      return;
    }
    
    // Debounce rapid clicks
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    setIsSubmitting(true);
    setCurrentWord(""); // Clear input immediately
    
    debounceTimeoutRef.current = setTimeout(() => {
      submitWordImmediate(wordToSubmit);
      setIsSubmitting(false);
    }, 200); // 200ms debounce
  }
  
  function submitWordImmediate(wordToSubmit) {
    try {
      // Client-side duplicate check
      const words = player.round.get("words") || [];
      const normalizedWord = normalizeString(wordToSubmit);
      const isDuplicate = words.some(w => normalizeString(w.text) === normalizedWord);

      if (isDuplicate) {
        console.log(`[Duplicate] Player ${player.id}: ${wordToSubmit}`);
        setLastWord(`"${wordToSubmit}" was already used!`);
        resetProgressBar();
        return;
      }

      // Check if API is already in progress
      if (player.get("apiTrigger")) {
        console.log(`[Block] Player ${player.id} API already in progress`);
        setLastWord("Please wait...");
        return;
      }

      console.log(`[Submit] Player ${player.id} submitting: ${wordToSubmit}`);
      
      // Calculate timestamps and penalties
      const timestamp = getRelativeTimestamp();
      const clientTimestamp = Date.now();
      const serverStartTime = stage.get("serverStartTime");
      
      applySlowResponsePenalty(words, timestamp);
      
      // Add word to array
      const newWord = {
        text: wordToSubmit,
        source: 'user',
        timestamp,
        clientTimestamp,
        clientRelativeTimestamp: clientTimestamp - serverStartTime,
      };
      
      const updatedWords = [...words, newWord];
      player.round.set("words", updatedWords);
      setLastWord(`You: ${wordToSubmit}`);

      // Set waiting state and trigger API
      setIsWaitingForAI(true);
      setShowProgressBar(false);
      player.set("apiTrigger", true);
      
      console.log(`[Submit] Player ${player.id} API triggered`);
      
    } catch (error) {
      console.error(`[Submit] Player ${player.id} error:`, error);
      // Reset state on error
      setIsWaitingForAI(false);
      setShowProgressBar(true);
      player.set("apiTrigger", false);
    }
  }
  
  function applySlowResponsePenalty(words, currentTimestamp) {
    const PENALTY_THRESHOLD = 20000; // 20 seconds
    let responseDelay = currentTimestamp; // For first word
    
    if (words.length > 0) {
      const lastWord = words[words.length - 1];
      responseDelay = currentTimestamp - lastWord.timestamp;
    }
    
    if (responseDelay > PENALTY_THRESHOLD) {
      const delayPoints = Math.floor(responseDelay / PENALTY_THRESHOLD);
      const currentPenalties = player.get("slowResponsePenalties") || 0;
      player.set("slowResponsePenalties", currentPenalties + delayPoints);
      console.log(`[Penalty] Player ${player.id}: +${delayPoints} penalties`);
    }
  }
  
  function resetProgressBar() {
    setShowProgressBar(false);
    setTimeout(() => setShowProgressBar(true), 50);
  }

  function handleAIResponse(response) {
    console.log(`[AI Response] Player ${player.id}: ${response.text}`);
    
    const timestamp = getRelativeTimestamp();
    const clientTimestamp = Date.now();
    const serverStartTime = stage.get("serverStartTime");

    const words = player.round.get("words") || [];
    const newAIWord = {
      text: response.text,
      source: 'ai',
      timestamp,
      clientTimestamp,
      clientRelativeTimestamp: clientTimestamp - serverStartTime,
      serverTimestamp: response.timestamp,
      apiLatency: response.apiLatency,
    };

    const updatedWords = [...words, newAIWord];
    player.round.set("words", updatedWords);
    player.stage.set("apiResponse", null); // Clear response

    setLastWord(`Partner: ${response.text}`);
    setIsWaitingForAI(false);
    setShowProgressBar(true);
    
    console.log(`[AI Response] Player ${player.id} turn returned to user`);
  }

  // function handleKeyDown(event) {
  //   if (event.key === "Enter" && !event.repeat) {
  //     event.preventDefault();
  //     handleSendWord();
  //   }
  // }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-6">Name as many items as you can (one at a time): {category}</h2>
      
      {/* Error banner */}
      {apiError && (
        <div className="w-full max-w-4xl mb-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error: </strong>
            Something went wrong. Please try again.
          </div>
        </div>
      )}
      
      <div className="w-full max-w-4xl flex mb-8">
        {/* Left side - Word History */}
        <div className="w-1/3 bg-gray-50 rounded-l-lg shadow-md p-4 border-r border-gray-200">
          <div className="text-sm uppercase tracking-wide text-gray-500 mb-2 text-center font-semibold">
            Previously named items
          </div>
          <div 
            ref={wordHistoryRef}
            className="h-72 overflow-y-auto px-2"
          >
            {(player.round.get("words") || []).map((word, index) => (
              <div key={index} className="mb-3 pb-2 border-b border-gray-100">
                <span className={`text-sm font-medium ${word.source === 'user' ? 'text-slate-600' : 'text-slate-800'}`}>
                  {word.source === 'user' ? 'You' : 'Partner'}:
                </span>
                <span className={`block text-lg ${word.source === 'user' ? 'text-slate-600' : 'text-slate-800'}`}>
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
                  isWaitingForAI || isSubmitting
                    ? 'bg-gray-100 border-gray-300 text-gray-500'
                    : 'border-blue-300 focus:ring-blue-500'
                }`}
                disabled={isWaitingForAI || isSubmitting}
                autoFocus
              />
              <Button 
                handleClick={handleSendWord} 
                disabled={isWaitingForAI || isSubmitting || currentWord.trim() === ""}
              >
                Send
              </Button>
            </div>

            {showProgressBar && !isWaitingForAI && (
              <TimeProgressBar isActive={showProgressBar && !isWaitingForAI} />
            )}
            
            <div className="text-center mt-4">
              {!isWaitingForAI ? (
                <p className="text-lg font-medium text-emerald-600">It's your turn!</p>
              ) : (
                <p className="text-lg font-medium text-gray-600">Waiting for your partner...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}