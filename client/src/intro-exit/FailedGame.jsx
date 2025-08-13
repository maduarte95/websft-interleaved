import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";

export function FailedGame({ next }) {
  const player = usePlayer();
  
  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-4">Study Ended</h2>
        <div className="space-y-4 text-center text-gray-600">
          <p className="text-xl">
            Thank you for your interest in participating in our study.
          </p>
          <p className="text-xl">
            We were not able to pair you with a partner, so the experiment could not start at this time.
          </p>
          <p className="text-xl">
          You can either wait for the study to start or end the task now. 
          </p>
        </div>
      </div>
      
      <Alert title="Payment Information">
        <p>
        If you wish to end the task here, you will be compensated for your time completing the surveys so far. Please submit the following code to Prolific:{" "}
          <strong>CWVAS57A</strong>
        </p>
        <p>
          We will use the code to send you a partial payment.
        </p>
        {/* <p className="pt-1">
          You will receive the <strong>base reward</strong> for your time.
        </p> */}
        <p className="pt-1">
          <strong>If you wish to continue the task, don't click "Continue" and wait a few minutes until we find a study partner.</strong>
        </p>
        <p className="pt-1">
          If you believe you are seeing this message in error, please refresh the page or contact the research team.
        </p>
      </Alert>

      <div className="mt-8 flex justify-center">
        <Button handleClick={next}>Continue</Button>
      </div>
    </div>
  );
}