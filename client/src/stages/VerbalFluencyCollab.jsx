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
  
  // Add error state management
  const [apiError, setApiError] = useState(null);

  // NEW: Track pending API responses to prevent lost responses
  const pendingResponseRef = useRef(false);
  // NEW: Synchronous submission lock
  const isSubmittingRef = useRef(false);

  // Text normalization function
  const normalizeString = (str) => {
    return str.trim().toLowerCase().replace(/[\s\-',.]+/g, ''); // Remove spaces, hyphens, apostrophes, commas, periods and convert to lowercase
  };
  
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
    console.log(`Component rendered. Start time: ${stage.get("serverStartTime")}, Current time: ${Date.now()}`);
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
    if (response && (isWaitingForAI || pendingResponseRef.current)) {
      handleAIResponse(response);
    }
  }, [player.stage.get("apiResponse")]);

  // Monitor for API errors from server
  useEffect(() => {
    const error = player.stage.get("apiError");
    if (error) {
      setApiError(error);
      setIsWaitingForAI(false);
      setShowProgressBar(true);
      // Clear error after displaying
      setTimeout(() => setApiError(null), 5000);
    }
  }, [player.stage.get("apiError")]);


  async function handleSendWord() {

    // Synchronous checks with ref
    if (currentWord.trim() === "" || isWaitingForAI || isSubmittingRef.current) {
      return;
    }
    
    // Immediately lock submissions and capture word
    isSubmittingRef.current = true;
    const wordToSubmit = currentWord.trim();
    setCurrentWord(""); // Clear input immediately

  
    try {

      // Check for duplicates before setting waiting state
      const words = player.round.get("words") || [];
      const normalizedWordToSubmit = normalizeString(wordToSubmit);
      const isDuplicate = words.some(w =>
        normalizeString(w.text) === normalizedWordToSubmit
      );

      if (isDuplicate) {
        console.log(`Duplicate word rejected: ${wordToSubmit}`);
        setLastWord(`"${wordToSubmit}" was already used!`);
        // Reset progress bar on duplicate rejection
        setShowProgressBar(false);
        setTimeout(() => setShowProgressBar(true), 10);
        return;  // Exit early without setting isWaitingForAI
      }

      // Set waiting state if no duplicates
      setIsWaitingForAI(true);
      console.log(`[Player ${player.id}] Starting word submission`);

      const serverStartTime = stage.get("serverStartTime");
      if (!serverStartTime) {
        throw new Error("No server start time available");
      }

      const timestamp = getRelativeTimestamp();
      const clientTimestamp = Date.now();
      const clientRelativeTimestamp = clientTimestamp - serverStartTime;
      
      console.log(`[Player ${player.id}] Got timestamps - stage timer: ${timestamp}ms, client relative: ${clientRelativeTimestamp}ms`);


      // Check if player took too long to respond to the last word
      if (words.length > 0) {
        const lastWord = words[words.length - 1];
        const responseDelay = timestamp - lastWord.timestamp;
        if (responseDelay > 20000) { // 10 seconds in milliseconds -> 20s
          const delayPoints = Math.floor(responseDelay / 20000);
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + delayPoints);
          console.log(`Slow response penalty applied: ${delayPoints} penalties`);
        }
      }

      //add penalty for slow first word too
      if (words.length === 0) {
        const responseDelay = timestamp;
        if (responseDelay > 20000) { // 10 seconds in milliseconds -> 20s
          const delayPoints = Math.floor(responseDelay / 20000);
          const currentPenalties = player.get("slowResponsePenalties") || 0;
          player.set("slowResponsePenalties", currentPenalties + delayPoints);
          console.log(`Slow response penalty applied to first word: ${delayPoints} penalties`);
        }
      }
  
      const updatedWords = [...words, {
        text: wordToSubmit,
        source: 'user',
        timestamp: timestamp,
        clientTimestamp: clientTimestamp,
        clientRelativeTimestamp: clientRelativeTimestamp,
      }];
 
      player.round.set("words", updatedWords); //await removed since it does nothing to this type of expression
      player.round.set("lastWord", wordToSubmit);  // Changed from currentWord.trim()
      setLastWord(`You: ${wordToSubmit}`);  // Changed from currentWord.trim()

      console.log(`[Player ${player.id}] Word submission complete:`, {
        word: wordToSubmit,  // Changed from currentWord.trim()
        timestamp,
        serverStartTime,
      });
      
      console.log(`Updated words: ${JSON.stringify(updatedWords)}`);

      //Clear progress bar and trigger AI response
      setShowProgressBar(false);
      await triggerAIResponse();
    
    } catch (error) {
      console.error(`[Player ${player.id}] Word submission failed:`, error);
      setIsWaitingForAI(false); // Reset waiting state on error
      // Reset progress bar on submission failure
      setShowProgressBar(false);
      setTimeout(() => setShowProgressBar(true), 10);
      // On error, restore the word to input if it wasn't a duplicate
      if (wordToSubmit && !words?.some(w => normalizeString(w.text) === normalizeString(wordToSubmit))) {
        setCurrentWord(wordToSubmit);
      }
    } finally {
      isSubmittingRef.current = false;
    }
  }


  async function triggerAIResponse() {
    try {
        if (player.get("apiTrigger")) {
            console.log("API call already in progress");
            return;
        }

        const relativeTimestamp = getRelativeTimestamp();
        console.log(`[Player ${player.id}] Relative timestamp for AI request: ${relativeTimestamp}`);

        // Track that we're expecting a response
        pendingResponseRef.current = true;

        // Record request timestamp
        const requestTimestamps = player.round.get("requestTimestamps") || [];
        const updatedTimestamps = [...requestTimestamps, relativeTimestamp];

        // Atomic updates
        await Promise.all([
            player.round.set("requestTimestamps", updatedTimestamps),
            player.set("apiTrigger", true)
        ]);

    } catch (error) {
        console.error(`[Player ${player.id}] Failed to trigger AI response:`, error);
        
        // Set user-visible error
        setApiError({
            message: "Something went wrong. Please try again.",
            type: "API_CALL_FAILED"
        });
        
        // Clean up all states if API trigger fails
        setIsWaitingForAI(false);
        setShowProgressBar(true);
        pendingResponseRef.current = false;
        await player.set("apiTrigger", false);
    }
}

  async function handleAIResponse(response) {
    console.log("Handling AI response:", response);
    pendingResponseRef.current = false;

    const timestamp = getRelativeTimestamp();
    const clientTimestamp = Date.now();
    const serverStartTime = stage.get("serverStartTime");
    const clientRelativeTimestamp = clientTimestamp - serverStartTime;

    const words = player.round.get("words") || [];
    const updatedWords = [...words, { 
      text: response.text, 
      source: 'ai', 
      timestamp: timestamp, // stage timer elapsed time
      clientTimestamp: clientTimestamp, // absolute client time
      clientRelativeTimestamp: clientRelativeTimestamp, // client-based elapsed time
      serverTimestamp: response.timestamp, // absolute server time
      serverRelativeTimestamp: response.timestamp - serverStartTime, // server-based elapsed time
      apiLatency: response.apiLatency,
    }];

    console.log("AI response timestamp since start of task:", response.timestamp, "setting words");
    
    player.round.set("words", updatedWords);
    setLastWord(`Partner: ${response.text}`);
    setIsWaitingForAI(false);
    player.stage.set("apiResponse", null);

    // Start the progress bar
    setShowProgressBar(true);

    console.log("AI response processed. Updated words:", updatedWords);
  }

  // function handleKeyDown(event) {
  //   if (event.key === "Enter" && !event.repeat) {
  //     event.preventDefault();
  //     handleSendWord();
  //   }
  // }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-3xl font-bold mb-6">Name as many items as you can: {category}</h2>
      
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
            Word History
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
                  isWaitingForAI || isSubmittingRef.current
                    ? 'bg-gray-100 border-gray-300 text-gray-500'
                    : 'border-blue-300 focus:ring-blue-500'
                }`}
                disabled={isWaitingForAI || isSubmittingRef.current}
                autoFocus
              />
              <Button 
                handleClick={handleSendWord} 
                disabled={isWaitingForAI || isSubmittingRef.current || currentWord.trim() === ""}
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