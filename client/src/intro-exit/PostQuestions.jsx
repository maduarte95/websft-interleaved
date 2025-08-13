import React, { useState, useEffect } from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function PostQuestions({ next }) {
  const player = usePlayer();
  const game = useGame();
  const [taskData, setTaskData] = useState([]);
  const [responses, setResponses] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const taskIndices = player.get("taskIndices");
    const taskCategories = player.get("taskCategories");

    if (taskIndices && taskCategories) {
      const newTaskData = taskIndices.map((taskName, index) => ({
        name: taskName,
        category: taskCategories[index],
        displayIndex: index + 1
      }));
      setTaskData(newTaskData);
      setResponses(newTaskData.map(() => ({
        strategyAnticipation: "",
        wordRetrieval: "",
        overallUsefulness: "",
        partnerWhich: ""
      })));
      setErrors(Array(newTaskData.length).fill(false));
    }
  }, [player]);

  const handleChange = (taskIndex, questionName, value) => {
    const newResponses = [...responses];
    newResponses[taskIndex] = {
      ...newResponses[taskIndex],
      [questionName]: value
    };
    setResponses(newResponses);
    
    // Clear error for this task if all questions are answered
    const taskResponse = newResponses[taskIndex];
    if (taskResponse.strategyAnticipation && 
        taskResponse.wordRetrieval && 
        taskResponse.overallUsefulness &&
        taskResponse.partnerWhich) {
      const newErrors = [...errors];
      newErrors[taskIndex] = false;
      setErrors(newErrors);
    }
  };

  const validateResponses = () => {
    const newErrors = responses.map(response => {
      return !response.strategyAnticipation || 
             !response.wordRetrieval || 
             !response.overallUsefulness ||
             !response.partnerWhich;
    });
    setErrors(newErrors);
    return !newErrors.some(error => error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateResponses()) {
      responses.forEach((response, index) => {
        player.set(`postQuestResponses${index + 1}`, response);
      });
      next();
    }
  };

  const renderLikertScale = (taskIndex, name, question) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{question}</label>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => (
          <label key={value} className="flex flex-col items-center">
            <input
              type="radio"
              name={`${name}_${taskIndex}`}
              value={value}
              checked={responses[taskIndex][name] === value.toString()}
              onChange={(e) => handleChange(taskIndex, name, e.target.value)}
              className="mb-1"
              required
            />
            <span>{value}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>Strongly Disagree</span>
        <span>Strongly Agree</span>
      </div>
    </div>
  );

  const renderLikertScaleAlternative = (taskIndex, name, question) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">{question}</label>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5, 6, 7].map((value) => (
          <label key={value} className="flex flex-col items-center">
            <input
              type="radio"
              name={`${name}_${taskIndex}`}
              value={value}
              checked={responses[taskIndex][name] === value.toString()}
              onChange={(e) => handleChange(taskIndex, name, e.target.value)}
              className="mb-1"
              required
            />
            <span>{value}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span>Strongly human</span>
        <span>Strongly AI system</span>
      </div>
    </div>
  );

  return (
    <div className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Post-Task Questionnaire</h2>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-700">
            Your partner may have been a human or an artificial intelligence (AI) system, and may have been different in each task. 
            Please recall the tasks you completed and rate the following statements from 
            1 to 7. You will receive the code for your bonus reward in the next page.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          {taskData.map((task, taskIndex) => (
            <div key={taskIndex} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">
                Task #{task.displayIndex} ({task.category})
              </h3>
              {renderLikertScale(
                taskIndex,
                "strategyAnticipation",
                "I felt that my partner anticipated my strategy during this task."
              )}
              {renderLikertScale(
                taskIndex,
                "wordRetrieval",
                "The interaction helped me retrieve words that I wouldn't have thought of otherwise in this task."
              )}
              {renderLikertScale(
                taskIndex,
                "overallUsefulness",
                "Overall, the interaction was useful for this task."
              )}

              {renderLikertScaleAlternative(
                taskIndex,
                "partnerWhich",
                "Did you think your partner was a human or an AI system?"
              )}
              {errors[taskIndex] && (
                <p className="text-red-500 mt-2">Please answer all questions for this task.</p>
              )}
            </div>
          ))}
          <Button type="submit">Next</Button>
        </form>
      </div>
    </div>
  );
}
