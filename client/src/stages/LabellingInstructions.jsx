import React, { useState, useEffect } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

export function LabellingInstructions() {
  const player = usePlayer();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const requiredTime = 77; // Adjust time as needed 0:47 + 30 = 77 seconds
  
  const handleContinue = () => {
    player.stage.set("submit", true);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prevTime => {
        const newTime = prevTime + 1;
        if (newTime >= requiredTime && !isButtonEnabled) {
          setIsButtonEnabled(true);
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isButtonEnabled, requiredTime]);

  return (
    <div className="max-w-2xl mx-auto p-4 overflow-y-auto max-h-full">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Instructions: Label Word Groups
      </h3>

      <Alert title="Watch the Video Instructions" kind="warn">
        Please make sure to watch the video below and read the instructions before proceeding to the next stage.
      </Alert>

      
        {/* Canva Video Embed */}
      <div style={{position: "relative", width: "100%", height: 0, paddingTop: "56.2500%", paddingBottom: 0, boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)", marginTop: "1em", marginBottom: "0.5em", overflow: "hidden", borderRadius: "8px", willChange: "transform"}}>
        <iframe 
          loading="lazy" 
          style={{position: "absolute", width: "100%", height: "100%", top: 0, left: 0, border: "none", padding: 0, margin: 0}}
          src="https://www.canva.com/design/DAGrSWHSh9I/eBHf_zfhB11mTANWKW5q2g/watch?embed"
          allowFullScreen={true}
          allow="fullscreen"
          title="Instructions - Stage 3"
        ></iframe>
      </div>


      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h4 className="text-xl font-bold mb-3">Task Overview:</h4>
        <p className="text-base mb-3">
          In this stage, you will see the word groups you identified in the previous step. 
          Your task is to provide a short label for the common theme of each group of related words.
        </p>
      </div>

      <div className="bg-green-50 p-6 rounded-lg mb-6">
        <h4 className="text-xl font-bold mb-3">Instructions:</h4>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Look at each group of words you marked as being related</li>
          <li>Think about what theme or concept connects these words together</li>
          <li>Enter a short, descriptive label that best describes what the words have in common</li>
          <li>Provide labels for all groups to complete the task</li>
          <li>There might be different strategies to group words together. There is no right or wrong answer.</li>
          <li>When you are done, click the button at the bottom to continue to the next stage <span className="font-bold">before the timer runs out</span>.</li>
        </ol>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg mb-6">
        <h4 className="text-xl font-bold mb-3">Examples:</h4>
        <p className="text-base mb-3">
          For the category "Fruits":
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>If you grouped "banana, lemon" → you might label it "yellow fruits"</li>
          <li>If you grouped "strawberry, blackberry, cranberry" → you might label it "berries"</li>
          <li>If you grouped "papaya, pear, passion fruit" → you might label it "words that start with 'p'"</li>
        </ul>
      </div>

      <Alert title="Watch the Video Instructions" kind="warn">
        <p>The button below will be disabled for the duration of the video, with some additional time (30 seconds) for reading the instructions.</p>
      </Alert>

      <div className="mt-6 flex justify-center">
        <Button 
          handleClick={isButtonEnabled ? handleContinue : () => {}} 
          disabled={!isButtonEnabled}
          autoFocus={isButtonEnabled}
          className={!isButtonEnabled ? "opacity-50 cursor-not-allowed" : ""}
        >
          Continue to Stage 3
        </Button>
      </div>
    </div>
  );
}