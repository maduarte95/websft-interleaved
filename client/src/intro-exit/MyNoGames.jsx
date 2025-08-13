import React from "react";
import { Alert } from "../components/Alert";

export function MyNoGames() {
  const completionCode = "CJHDKHIZ"; // You can change this code as needed

  return (
    <div className="h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-center mb-8">
          No Experiments Currently Available
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <p className="text-gray-600 mb-4">
            Thank you for your interest in participating. Unfortunately, all available slots for this study are currently filled.
          </p>
          <p className="text-gray-600">
            Please submit the following completion code on Prolific:
          </p>
        </div>

        <Alert title="Completion Code">
          <p className="text-lg font-mono mt-2">
            {completionCode}
          </p>
          <p className="text-sm text-gray-600 mt-4">
            You will be asked to return your submission. Alternatively, you can try again later.
          </p>
        </Alert>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>If you believe you are seeing this message in error, please refresh the page or contact the research team.</p>
        </div>
      </div>
    </div>
  );
}