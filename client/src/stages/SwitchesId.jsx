import React, { useState, useEffect } from "react";
import { usePlayer, useRound } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function SwitchesId() {
  const player = usePlayer();
  const round = useRound();
  const [wordList, setWordList] = useState([]);
  const [switchMarks, setSwitchMarks] = useState({});
  const [wordGroups, setWordGroups] = useState([]);

  // Subtle group styling
  const groupColorClass = 'bg-gray-100 border-gray-200';

  useEffect(() => {
    const words = player.round.get("words") || [];
    const simplifiedWords = words.map((word, index) => ({
      id: index,
      text: word.text,
      isSwitch: false
    }));
    setWordList(simplifiedWords);
    
    // Initialize switchMarks with first word always marked (if words exist)
    if (simplifiedWords.length > 0) {
      setSwitchMarks({ 0: true });
    }
  }, []);

  // Auto-save switches whenever they change
  useEffect(() => {
    if (wordList.length > 0) {
      const markedWords = wordList.map((word) => ({
        index: word.id,
        word: word.text,
        switch: word.id === 0 ? 1 : (switchMarks[word.id] ? 1 : 0)
      }));
      
      player.round.set("switches", markedWords);
    }
  }, [switchMarks, wordList]);

  // Calculate groups whenever switchMarks changes
  useEffect(() => {
    if (wordList.length === 0) return;

    const groups = [];
    let currentGroup = [];
    let currentGroupStart = 0;

    wordList.forEach((word, index) => {
      if (switchMarks[index] && currentGroup.length > 0) {
        // End current group and start new one
        groups.push({
          start: currentGroupStart,
          end: index - 1,
          words: [...currentGroup],
          colorClass: groupColorClass
        });
        currentGroup = [word];
        currentGroupStart = index;
      } else {
        currentGroup.push(word);
        if (index === 0) {
          currentGroupStart = 0;
        }
      }
    });

    // Add the final group
    if (currentGroup.length > 0) {
      groups.push({
        start: currentGroupStart,
        end: wordList.length - 1,
        words: [...currentGroup],
        colorClass: groupColorClass
      });
    }

    setWordGroups(groups);
  }, [switchMarks, wordList]);

  // Get the group for a specific word index
  const getWordGroup = (wordIndex) => {
    return wordGroups.find(group => 
      wordIndex >= group.start && wordIndex <= group.end
    );
  };

  const toggleSwitch = (id) => {
    // Don't allow toggling the first word
    if (id === 0) return;

    setSwitchMarks(prev => {
      const newMarks = { ...prev };
      newMarks[id] = !newMarks[id];
      return newMarks;
    });
  };

  const handleContinue = () => {
    // Create an array of words with their index and switch value (0 or 1)
    const markedWords = wordList.map((word) => ({
      index: word.id,
      word: word.text,
      switch: word.id === 0 ? 1 : (switchMarks[word.id] ? 1 : 0)
    }));
    
    player.round.set("switches", markedWords);
    player.stage.set("submit", true);
  };

  const handleSkip = () => {
    // Set empty switches data and continue
    player.round.set("switches", []);
    player.stage.set("submit", true);
  };

  // If no words were provided, show skip option
  if (wordList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">No Words to Group</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <p className="text-gray-700 leading-relaxed">
              It looks like no words were provided in the previous stage. 
              Since there are no words to group, you can skip this stage and continue to the next one.
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
    <div className="flex flex-col items-center justify-start h-full max-w-6xl mx-auto px-4 pt-8">
      <h2 className="text-2xl font-bold mb-6">Identify Related Item Groups</h2>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center max-w-4xl">
        <p className="text-gray-700 leading-relaxed text-justify">
          You might find that you listed some words in a row that were related to each other in some common theme.
          <span className="font-bold"> Place an X next to each word that you think starts a group of words with the same theme. </span> If you feel as 
          though several words in a row are not related to each other in some way, you can continue to 
          place an X next to those words. There is no right or wrong answer; people have different 
          opinions about the way in which words are related.
        </p>
        <p className="text-gray-700 leading-relaxed text-justify mt-4">
          When you are done, click the button at the bottom to continue to the next stage <span className="font-bold">before the timer runs out</span>.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="w-full max-w-5xl flex gap-6 mb-8">
        {/* Left column - Word List */}
        <div className="w-1/2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 className="text-lg font-semibold text-center">Word List</h3>
            <p className="text-sm text-gray-600 text-center mt-1">Click X to mark the start of a new group</p>
          </div>
          <div className="h-[44rem] overflow-y-auto p-4">
            {wordList.map((word) => {
              const group = getWordGroup(word.id);
              const isGroupStart = switchMarks[word.id];
              
              return (
                <div
                  key={word.id}
                  className={`flex items-center justify-between p-3 transition-all duration-200 rounded-lg mb-1 border-2 ${
                    group ? group.colorClass : 'border-transparent hover:bg-gray-50'
                  } ${isGroupStart ? 'border-l-4 border-l-blue-500' : ''}`}
                >
                  <div className="flex items-center flex-1 mr-4">
                    <span className="text-lg">{word.text}</span>
                  </div>
                  <button
                    onClick={() => toggleSwitch(word.id)}
                    disabled={word.id === 0}
                    className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                      word.id === 0 
                        ? 'border-blue-500 bg-blue-50 text-blue-500 cursor-not-allowed opacity-75'
                        : switchMarks[word.id]
                        ? 'border-blue-500 bg-blue-500 text-white hover:bg-blue-600'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {word.id === 0 || switchMarks[word.id] ? 'X' : ''}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column - Groups Preview */}
        <div className="w-1/2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <h3 className="text-lg font-semibold text-center">
              Groups Created ({wordGroups.length} group{wordGroups.length !== 1 ? 's' : ''})
            </h3>
            <p className="text-sm text-gray-600 text-center mt-1">Preview of your word groups</p>
          </div>
          <div className="h-[44rem] overflow-y-auto p-4">
            {wordGroups.length > 0 ? (
              <div className="space-y-3">
                {wordGroups.map((group, groupIndex) => (
                  <div key={groupIndex} className={`p-4 rounded-lg border-2 ${group.colorClass}`}>
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      Group {groupIndex + 1}: {group.words.length} word{group.words.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.words.map((word, wordIndex) => (
                        <span 
                          key={wordIndex} 
                          className="inline-block bg-white px-2 py-1 rounded text-sm text-gray-700 border border-gray-300"
                        >
                          {word.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <p>No groups created yet</p>
                  <p className="text-sm mt-1">Mark words with X to create groups</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-12">
        <Button handleClick={handleContinue}>
          Continue to Next Stage
        </Button>
      </div>
    </div>
  );
}