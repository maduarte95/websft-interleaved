import React, { useState } from "react";
import { usePlayer } from "@empirica/core/player/classic/react";
import { Button } from "../components/Button";

export function PreTask({ next }) {
  const player = usePlayer();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [isNativeEnglish, setIsNativeEnglish] = useState(null);
  const [education, setEducation] = useState("");
  const [error, setError] = useState("");
  

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!age || isNativeEnglish === null || !education) {
      setError("Please fill out all fields.");
      return;
    }

    // Check if the age is within the limit
    if (age < 18 || age > 100) {
      setError("Age must be between 18 and 100.");
      return;
    }
  
    // Check if the participant meets the requirements ## change to not native!
    if (isNativeEnglish === false) { 
      setError("This study requires native English speakers. Thank you for your interest. Please submit the following code on Prolific: CTNT70UV");
      return;
    }

    // Set the collected data to the player
    player.set("age", age);
    player.set("gender", gender)
    player.set("isNativeEnglish", isNativeEnglish);
    player.set("education", education);

    // Proceed to the next steps
    next();
  };

  return (
    <div className="mt-3 sm:mt-5 p-20">
      <h3 className="text-lg leading-6 font-medium text-gray-900">
        Demographic Information
      </h3>
      <form onSubmit={handleSubmit} className="mt-5 space-y-6">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            Age
          </label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <select
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select...</option>
            <option value="m">Male</option>
            <option value="f">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Are you a native English speaker?
          </label>
          <div className="mt-2 space-x-6">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="nativeEnglish"
                value="yes"
                checked={isNativeEnglish === true}
                onChange={() => setIsNativeEnglish(true)}
                className="form-radio"
              />
              <span className="ml-2">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="nativeEnglish"
                value="no"
                checked={isNativeEnglish === false}
                onChange={() => setIsNativeEnglish(false)}
                className="form-radio"
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>
        <div>
          <label htmlFor="education" className="block text-sm font-medium text-gray-700">
            Highest Level of Education
          </label>
          <select
            id="education"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          >
            <option value="">Select...</option>
            <option value="none">None</option>
            <option value="highSchool">High School/Secondary Education</option>
            <option value="bachelor">Bachelor's Degree</option>
            <option value="master">Master's Degree</option>
            <option value="phd">Ph.D. or Equivalent</option>
          </select>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}