import React, { useState, useEffect } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

export function SwitchesIdInstructions() {
  const player = usePlayer();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const requiredTime = 92; //57 1:02  62+30 = 92 seconds
  
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
        Instructions: Identify Related Item Groups
      </h3>

    {/* Alert to watch the video instructions*/}
      <Alert title="Watch the Video Instructions" kind="warn">
        Please make sure to watch the video below and read the instructions before proceeding to the next stage.
      </Alert>

      {/* Canva Video Embed */}
      <div style={{position: "relative", width: "100%", height: 0, paddingTop: "56.2500%", paddingBottom: 0, boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)", marginTop: "1em", marginBottom: "0.5em", overflow: "hidden", borderRadius: "8px", willChange: "transform"}}>
        <iframe 
          loading="lazy" 
          style={{position: "absolute", width: "100%", height: "100%", top: 0, left: 0, border: "none", padding: 0, margin: 0}}
          src="https://www.canva.com/design/DAGrSYGgdy0/IVIL_zBtvd-pqoLFR0qg3w/watch?embed"
          allowFullScreen={true}
          allow="fullscreen"
          title="Instructions - Stage 2"
        ></iframe>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg mb-6">
        <h4 className="text-xl font-bold mb-3">Instructions:</h4>
        <p className="text-base mb-3">
          You might find that some words listed in the previous stage were related to each other in some common theme. In this stage, you will be asked to identify those groups of related words.
        </p>
        <p className="text-base mb-3">
          Your task is to <span className="font-bold"> place an X next to each word that you think starts a group of words with the same theme. </span>
        </p>
        <p className="text-base mb-3">
          If you feel as though several words in a row are not related to each other in some way, you can continue to place an X next to those words.
        </p>
        <p className="text-base mb-3">
          There is no right or wrong answer; people have different opinions about the way in which words are related.
        </p>
        <p className="text-base mb-3">
          In the stage after this one, you will be asked to label these groups.
        </p>
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
          Continue to Stage 2
        </Button>
      </div>
    </div>
  );
}