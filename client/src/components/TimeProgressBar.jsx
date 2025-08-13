import React, { useState, useEffect } from "react";

export function TimeProgressBar({ isActive }) {
  const [progress, setProgress] = useState(0);
  const [color, setColor] = useState("bg-blue-500");
  const [penalties, setPenalties] = useState(0);
  const [showIndicator, setShowIndicator] = useState(false);
  
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setColor("bg-blue-500");
      setShowIndicator(false);
      setPenalties(0);
      return;
    }
    
    const intervalTime = 100; // update every 100ms for smoother animation
    const totalTime = 20000; // 10 seconds -> 20s
    const intervalId = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (intervalTime / totalTime) * 100;
        
        // Update color based on progress
        if (newProgress < 30) {
          setColor("bg-blue-500");
        } else if (newProgress < 60) {
          setColor("bg-green-500");
        } else if (newProgress < 90) {
          setColor("bg-orange-500");
        } else {
          setColor("bg-red-500");
        }
        
        // Calculate penalties - one penalty for every completed totalTime seconds (10s or 20s)
        const newPenalties = Math.floor(newProgress / 100);
        
        // Show indicator and update penalties when time exceeds 10 seconds
        if (newProgress >= 100) {
          setShowIndicator(true);
          setPenalties(newPenalties);
        }
        
        return newProgress; // Allow progress to go beyond 100% to track multiple penalties
      });
    }, intervalTime);
    
    return () => clearInterval(intervalId);
  }, [isActive]);
  
  // Calculate the visual progress (capped at 100% for display purposes)
  const visualProgress = Math.min(progress, 100);
  
  return (
    <div className="w-full mt-2">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full transition-all`} 
          style={{ width: `${visualProgress}%` }}
        ></div>
      </div>
      
      {showIndicator && (
        <div className="text-red-600 text-sm mt-1 animate-pulse">
          Slow response! Penalties applied: {penalties}
        </div>
      )}
    </div>
  );
}