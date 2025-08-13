import React from "react";
import { Button } from "../components/Button";

export function IntroductionInterleaved({ next }) {
  return (
    <div className="max-w-2xl mx-auto mt-3 sm:mt-5 p-8">
      <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
        Instructions: Collaborative Item Naming
      </h3>
      
      <div className="space-y-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Game Overview:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>You'll participate in two 3-minute rounds</li>
            <li>You'll collaborate with a partner to name as many items as you can from a given category</li>
            <li>In each round, you'll take turns naming items</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-base font-bold mb-3">How It Works:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>When it's your turn, name one item from the category</li>
            <li>After you submit an item by pressing Enter, it becomes your partner's turn</li>
            <li>Wait for your partner to submit their item before your next turn</li>
            <li>Continue alternating turns until the time runs out</li>
          </ul>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Display and Scoring:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Score for both players is based on the total number of of items named together unique items submitted by you and your partner</li>
            <li>The screen will display all items named and the current score</li>
            <li>A timer will show the remaining time for each round</li>
            <li>Once your turn starts, an additional 20-second timer will be displayed. A penalty for slow responses will be applied every 20 seconds since the start of your turn.</li>
          </ul>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <p className="text-base font-bold mb-3">Important Notes:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Press Enter to submit an item</li>
            <li>Once your turn starts, submit an item as fast as possible</li>
            <li>Submit only items from the requested category. Do not include anything else.</li>
            <li>Each item should be unique - no repetitions</li>
            <li>Your bonus will be based on the combined scores from all rounds with a deduction for slow responses</li>
            <li>You will receive the code for your bonus after you complete the post-task assessment</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button handleClick={next} autoFocus>
          Next
        </Button>
      </div>
    </div>
  );
}