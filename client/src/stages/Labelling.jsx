import React, { useState, useEffect } from "react";
import { usePlayer, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function Labelling() {
  const player = usePlayer();
  const round = useRound();
  const [groupLabels, setGroupLabels] = useState({});
  const [wordGroups, setWordGroups] = useState([]);

  useEffect(() => {
    // Get the switches data from SwitchesId stage
    const switches = player.round.get("switches") || [];
    const words = player.round.get("words") || [];
    
    // If no switches data or empty switches, set empty groups
    if (switches.length === 0) {
      setWordGroups([]);
      return;
    }
    
    // Create groups based on switch markers
    const groups = [];
    let currentGroup = [];
    let currentGroupIndexes = [];
    let currentGroupStartIndex = 0;
    
    switches.forEach((switchData, index) => {
      if (switchData.switch === 1 && currentGroup.length > 0) {
        // End the current group and start a new one
        groups.push({
          id: currentGroupStartIndex,
          startIndex: currentGroupStartIndex,
          allIndexes: [...currentGroupIndexes],
          startWord: switches[currentGroupStartIndex].word,
          words: [...currentGroup]
        });
        currentGroup = [switchData.word];
        currentGroupIndexes = [index];
        currentGroupStartIndex = index;
      } else {
        currentGroup.push(switchData.word);
        currentGroupIndexes.push(index);
        if (index === 0) {
          currentGroupStartIndex = 0;
        }
      }
    });
    
    // Add the final group
    if (currentGroup.length > 0) {
      groups.push({
        id: currentGroupStartIndex,
        startIndex: currentGroupStartIndex,
        allIndexes: [...currentGroupIndexes],
        startWord: switches[currentGroupStartIndex].word,
        words: [...currentGroup]
      });
    }
    
    setWordGroups(groups);
    
    // Initialize empty labels for each group
    const initialLabels = {};
    groups.forEach(group => {
      initialLabels[group.id] = '';
    });
    setGroupLabels(initialLabels);
    
  }, []);

  // Effect for saving group labels periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (wordGroups.length > 0) {
        const groupLabelData = wordGroups.map(group => ({
          startIndex: group.startIndex,
          allIndexes: group.allIndexes,
          startWord: group.startWord,
          words: group.words,
          label: groupLabels[group.id] || ''
        }));
        
        player.round.set("groupLabels", groupLabelData);
      }
    }, 10000); // Save every 10 seconds

    return () => clearInterval(interval);
  }, [wordGroups, groupLabels]);

  const handleLabelChange = (groupId, label) => {
    setGroupLabels(prev => ({
      ...prev,
      [groupId]: label
    }));
  };

  const handleSubmit = () => {
    // Save the labels in a format that maps to SwitchesId data
    const groupLabelData = wordGroups.map(group => ({
      startIndex: group.startIndex,
      allIndexes: group.allIndexes,
      startWord: group.startWord,
      words: group.words,
      label: groupLabels[group.id] || ''
    }));
    
    player.round.set("groupLabels", groupLabelData);
    player.stage.set("submit", true);
  };

  const handleSkip = () => {
    // Set empty group labels and continue
    player.round.set("groupLabels", []);
    player.stage.set("submit", true);
  };

  const allLabelsCompleted = wordGroups.every(group => 
    groupLabels[group.id] && groupLabels[group.id].trim() !== ''
  );

  // If no word groups were created, show skip option
  if (wordGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">No Word Groups to Label</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 leading-relaxed">
              It looks like no word groups were created in the previous stage. 
              Since there are no groups to label, you can skip this stage and continue to the next one.
            </p>
          </div>
        </div>
        
        <Button handleClick={handleSkip}>
          Skip to Next Stage
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start h-full max-w-4xl mx-auto px-4 pt-6">
      <h2 className="text-2xl font-bold mb-4">Label Word Groups</h2>
      
      <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center max-w-3xl">
        <p className="text-gray-700 leading-relaxed">
          Below are the groups of related words you identified in the previous stage. 
          <span className="font-bold"> Please provide a short label for the common theme of each group of words.</span>
        </p>
      </div>

      <div className="w-full max-w-3xl bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="max-h-96 overflow-y-auto p-6">
          {wordGroups.map((group, groupIndex) => (
            <div key={group.id} className="mb-8 last:mb-4">
              {/* Group Header */}
              <div className="flex items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800 mr-4">
                  Group {groupIndex + 1}:
                </h3>
                <input
                  type="text"
                  value={groupLabels[group.id] || ''}
                  onChange={(e) => handleLabelChange(group.id, e.target.value)}
                  placeholder="Enter a descriptive theme or label..."
                  className="flex-1 p-2 text-base border rounded focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                />
              </div>
              
              {/* Group Words */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                <div className="flex flex-wrap gap-2">
                  {group.words.map((word, wordIndex) => (
                    <span
                      key={wordIndex}
                      className="inline-block bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-700 border border-gray-200"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <Button 
          handleClick={allLabelsCompleted ? handleSubmit : () => {}} 
          autoFocus={allLabelsCompleted}
          className={!allLabelsCompleted ? "opacity-50 cursor-not-allowed" : ""}
        >
          Continue to Next Stage
        </Button>
      </div>
      
      {!allLabelsCompleted && (
        <div className="text-sm text-gray-500 text-center">
          Please provide labels for all word groups to continue
        </div>
      )}
    </div>
  );
}