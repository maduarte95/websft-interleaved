import React, { useState, useEffect, useRef } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog";
const TIME_LIMIT = 15; // time limit

export function TypingSpeedTest({ next }) {
  const [inputText, setInputText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const player = usePlayer();
  const [hasFailed, setHasFailed] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (inputText.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [inputText, startTime]);

  useEffect(() => {
    if (startTime && !isFinished) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const remaining = TIME_LIMIT - elapsed;
        setTimeLeft(remaining >= 0 ? remaining : 0);

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setIsFinished(true);
          setHasFailed(true);
          calculateSpeed();
          player.set("failed_typing_test", true);
          console.log("Failed typing test - timer expired");
        }
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [startTime, isFinished]);

  const handleInputChange = (e) => {
    if (!isFinished) {
      setInputText(e.target.value);
      if (e.target.value === SAMPLE_TEXT) {
        setEndTime(Date.now());
        setIsFinished(true);
        setHasFailed(false);
        calculateSpeed();
        // Clear any existing timer to prevent race condition
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
    }
  };

  const calculateSpeed = () => {
    const timeInSeconds = Math.min((endTime || Date.now()) - startTime, TIME_LIMIT * 1000) / 1000;
    const wordsTyped = SAMPLE_TEXT.split(" ").length;
    const charactersTyped = SAMPLE_TEXT.length;

    const wpm = Math.round((wordsTyped / timeInSeconds) * 60);
    const cpm = Math.round((charactersTyped / timeInSeconds) * 60);

    player.set("typingSpeedWPM", wpm);
    player.set("typingSpeedCPM", cpm);
    player.set("typingSpeedTime", timeInSeconds);

  };



  const handleContinue = () => {
    if (!hasFailed) {
      next();
    }
  };




  return (
    <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto px-4">
      <h2 className="text-3xl font-bold mb-6">Typing Speed Test</h2>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left w-full">
        <h3 className="text-xl font-semibold mb-2">Instructions:</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>Type the text displayed below as quickly and accurately as you can (case sensitive).</li>
          <li>You have {TIME_LIMIT} seconds to complete the test.</li>
          <li>The timer will start when you begin typing.</li>
          <li>Click "Continue" when you're done.</li>
        </ul>
      </div>

      <div className="bg-blue-100 p-4 rounded-lg mb-6 w-full">
        <h3 className="text-xl font-semibold mb-2">Text:</h3>
        <p className="text-lg font-bold">{SAMPLE_TEXT}</p>
      </div>

      <p className="mb-4 text-lg">Time left: {timeLeft} seconds</p>
      
      <textarea
        value={inputText}
        onChange={handleInputChange}
        className="w-full max-w-lg p-2 border border-gray-300 rounded mb-4"
        rows={3}
        disabled={isFinished}
        placeholder="Start typing here..."
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
      />
      
    {/* show button only if failed that redirects to https://app.prolific.com/submissions/complete?cc=CTNT70UV */}
    {isFinished && hasFailed && (
        <div className="w-full max-w-lg">
          <Alert title="Study Participation">
            <p className="mb-2">
              Thank you for your interest in our study. Unfortunately, you did not complete the typing test within the required time limit.
            </p>
            <p className="font-semibold">
              Please submit the following code on Prolific: CTNT70UV
            </p>
          </Alert>
          <p className="mt-4 text-sm text-gray-600">
            Your typing speed: {player.get("typingSpeedWPM")} WPM
          </p>
        </div>
      )}
      
      {isFinished && !hasFailed && (
        <div>
          <p className="mb-4">Your typing speed: {player.get("typingSpeedWPM")} WPM</p>
          <Button handleClick={handleContinue}>Continue</Button>
        </div>
      )}
    </div>
  );
}
