import React, { useState, useEffect } from "react";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

export function IntroductionInterleaved({ next }) {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const requiredTime = 4; // video duration + 30 seconds 240

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
    <div className="max-w-2xl mx-auto mt-3 sm:mt-5 p-8">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
        Instructions
      </h3>

      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Overview:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>This task consists of <strong>two rounds of three diffferent stages</strong></li>
            <li>In the <strong>first stage (item naming task)</strong> you will be asked to collaborate with a partner to name as many items as you can from a selected category within 3 minutes</li>
            <li>You and your partner will receive a <strong>bonus payment for every item</strong> you name in this step, with a <strong>penalty for slow responses</strong></li>
            <li>You will then be asked to <strong>group together similar words</strong> you think may be related through a common theme and to <strong>label the groups of related words</strong> you've identified</li>
            <li>In the second round, you will collaborate with a different partner and name words from a different category. <strong>Your completion code will be available after you complete the two rounds</strong></li>
            <li>As you complete each stage, <strong>you will not be able to go back</strong> to previous stages or instructions pages</li>
          </ul>
        </div>

        {/* Alert to watch the video instructions*/}
        <Alert title="Watch the Video Instructions" kind="warn">
          <p>The button below will be enabled after some time. Meanwhile, please watch the video and read the instructions before proceeding.</p>
        </Alert>

        {/* Canva Video Embed */}
        <div style={{position: "relative", width: "100%", height: 0, paddingTop: "56.2500%", paddingBottom: 0, boxShadow: "0 2px 8px 0 rgba(63,69,81,0.16)", marginTop: "1.6em", marginBottom: "0.9em", overflow: "hidden", borderRadius: "8px", willChange: "transform"}}>
          <iframe 
            loading="lazy" 
            style={{position: "absolute", width: "100%", height: "100%", top: 0, left: 0, border: "none", padding: 0, margin: 0}}
            src="https://www.canva.com/design/DAGwicL42b4/M5DzaPD6PHo3AUQub28f7A/watch?embed"
            allowFullScreen={true}
            allow="fullscreen"
            title="Instructions - Item Naming Task"
          ></iframe>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Item Naming: Display and Scoring:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You will take turns with a partner to name items from a category</li>
            <li>Wait for your turn, then submit an item by pressing Enter</li>
            <li>A timer will show the remaining time for each round</li>
            <li>Score is based on the total number of unique items submitted by you and your partner</li>
            <li>The screen will display all items named and the current score</li>
            <li>Pay attention to the start of your turn: once your partner submits a word, an additional 20-second timer will be displayed. A penalty for slow responses will be applied to your bonus every 20 seconds</li>
            <li>Continue alternating turns until the time runs out (3 minutes)</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Important Notes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>When your turn starts, submit items as fast as possible, <strong>one at a time</strong></li>
            <li>Submit only items from the requested category. <strong>To ensure your task is accepted, do not include anything else</strong></li>
            <li>Each item should be unique - no repetitions</li>
            <li>Don't submit the same item in the plural and singular forms</li>
          </ul>
        </div>
      </div>

      <Alert title="Watch the Video Instructions" kind="warn">
        <p>IMPORTANT: please don't close your browser or leave the experiment once you click the "Continue" button!</p>
        <p>After this page, you will be paired with a participant.</p>
        <p>If you leave the experiment after clicking "Continue", your submission will not be accepted and you will have to return it.</p>

      </Alert>


      <div className="mt-8 flex justify-center">
        <Button 
          handleClick={isButtonEnabled ? next : () => {}} 
          disabled={!isButtonEnabled}
          autoFocus={isButtonEnabled}
          className={!isButtonEnabled ? "opacity-50 cursor-not-allowed" : ""}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}