import React from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Alert } from "../components/Alert";
import { Button } from "../components/Button";

export function FinalScoreSummary({ next }) {
  const player = usePlayer();
  const score = player.get("score") || 0;
  const bonusRate = 0.02; // $0.02 per point
  const penaltyRate = 0.01; // £0.01 per slow response
  const penaltyAmount = player.get("slowResponsePenalties") * penaltyRate;
  const slowResponsePenalties = player.get("slowResponsePenalties") || 0;
  const bonusBeforePenalty = score * bonusRate;
  const totalBonus = Math.max(0, bonusBeforePenalty - penaltyAmount).toFixed(2); //ensure bonus is not negative

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center mb-4">Experiment Complete!</h2>
        <div className="space-y-2 text-center text-gray-600">
          <p className="text-xl">
            Total Word Score: <span className="font-bold">{score}</span>
          </p>
          <p className="text-xl">
            Final Bonus: <span className="font-bold">£{totalBonus}</span>
            {/* <span className="text-sm ml-2">(£0.02 per point)</span> */}
          </p>
          {bonusBeforePenalty > 0 && (
            <p className="text-md text-green-600">
              Word bonus: £{bonusBeforePenalty.toFixed(2)}
              <span className="text-sm ml-2">(£0.02 per point)</span>
            </p>
          )}
          {slowResponsePenalties > 0 && (
            <p className="text-md text-red-600">
              Slow response penalty: -£{penaltyAmount.toFixed(2)}
              <span className="text-sm ml-2">(-£0.01 per 20s)</span> 
            </p>
          )}
        </div>
      </div>

      <Alert title="Payment Information">
        <p>
          Please copy and submit the following code to receive your payment:{" "}
          {/* <strong>NFDV475O</strong> */}
          <strong>C162XOKU</strong>
        </p>
        <p className="pt-1">
          You will receive a <strong>£{totalBonus} bonus</strong> in addition to the{" "}
          <strong>base reward</strong> for completing the task.
        </p>
      </Alert>

      <div className="mt-8 flex justify-center">
        <Button handleClick={next}>End experiment (you will not see the code anymore!)</Button>
        {/* Add redirect to https://app.prolific.com/submissions/complete?cc=C162XOKU */}
      </div>
    </div>
  );
}