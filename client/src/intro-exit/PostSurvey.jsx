
import React, { useState, useEffect } from "react";
import { usePlayer, useGame } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function PostSurvey({ next }) {
  const player = usePlayer();
  const game = useGame();
  const [experiences, setExperiences] = useState([]);
  const [taskData, setTaskData] = useState([]);
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
      setExperiences(Array(newTaskData.length).fill(""));
      setErrors(Array(newTaskData.length).fill(false));
    }
  }, [player]);

  const handleExperienceChange = (index, value) => {
    const newExperiences = [...experiences];
    newExperiences[index] = value;
    setExperiences(newExperiences);

    // Clear error for this task if text is entered
    if (value.trim()) {
      const newErrors = [...errors];
      newErrors[index] = false;
      setErrors(newErrors);
    }
  };

  const validateResponses = () => {
    const newErrors = experiences.map(exp => !exp.trim());
    setErrors(newErrors);
    return !newErrors.some(error => error);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateResponses()) {
      experiences.forEach((experience, index) => {
        player.set(`postSurveyExperience${index + 1}`, experience);
      });
      next();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Post-Survey</h2>
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-700">
          Please recall the tasks you completed and write about your subjective experience. There are no right or wrong answers.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        {taskData.map((task, index) => (
          <div key={index} className="mb-6">
            <label htmlFor={`experience${index}`} className="block text-sm font-medium text-gray-700 mb-2">
              Describe your experience with task #{task.displayIndex} ({task.category}):
            </label>
            <textarea
              id={`experience${index}`}
              name={`experience${index}`}
              rows="4"
              className={`w-full px-3 py-2 text-gray-700 border rounded-lg focus:outline-none ${
                errors[index] ? 'border-red-500' : 'border-gray-300'
              }`}
              value={experiences[index]}
              onChange={(e) => handleExperienceChange(index, e.target.value)}
              placeholder="Please share your thoughts and feelings about this task..."
              required
            />
            {errors[index] && (
              <p className="text-red-500 mt-1">Please provide your experience for this task.</p>
            )}
          </div>
        ))}
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}