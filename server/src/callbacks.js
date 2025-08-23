import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { SFTClient } from "./utils/SFTClient";

export const Empirica = new ClassicListenersCollector();

// Changes on server side are synchronous
// This means if a callback is blocking, it will delay the processing of other callbacks for other players!
// Use flush to avoid delays!

const categoryMap = {
  A: "animals",
  S: "supermarket items",
  C: "clothing items",
  // // === VIDEO RECORDING SETUP - REMOVE BEFORE DEPLOYMENT ===
  // F: "fruits"  // Added for human-human video recording demo
  // // === END VIDEO RECORDING SETUP ===
};

// One shared client
const client = new SFTClient();

// ============ TESTING CALLBACKS (COMMENTED OUT) ============
// Test callbacks to verify async behavior doesn't block other players
// Uncomment to test blocking vs non-blocking callback patterns

// // Dummy async function that simulates API delay
// function dummyAPICall(playerId, delay = 8000) {
//   return new Promise(resolve => {
//     console.log(`[DUMMY TEST] Starting dummy API call for player ${playerId} (${delay}ms delay)`);
//     setTimeout(() => {
//       console.log(`[DUMMY TEST] Dummy API call completed for player ${playerId}`);
//       resolve(`dummy-response-${playerId}-${Date.now()}`);
//     }, delay);
//   });
// }

// // Test with BLOCKING pattern (old way) - causes player serialization
// Empirica.on("player", "testTriggerBlocking", async (ctx, { player }) => {
//   if (!player.get("testTriggerBlocking")) return;
//   
//   const startTime = Date.now();
//   const serverStartTime = player.currentStage.get("serverStartTime");
//   const relativeTime = serverStartTime ? startTime - serverStartTime : startTime;
//   
//   console.log(`[BLOCKING TEST] Callback started for player ${player.id} at ${relativeTime}ms`);
//   
//   try {
//     // This will BLOCK other players' callbacks
//     const response = await dummyAPICall(player.id, 5000);
//     
//     player.stage.set("testResponse", {
//       response: response,
//       timestamp: Date.now(),
//       playerId: player.id
//     });
//     
//     console.log(`[BLOCKING TEST] Response set for player ${player.id}: ${response}`);
//   } catch (error) {
//     console.error(`[BLOCKING TEST] Error for player ${player.id}:`, error);
//   } finally {
//     await player.set("testTriggerBlocking", false);
//     console.log(`[BLOCKING TEST] Callback completed for player ${player.id}`);
//   }
// });

// // Test with NON-BLOCKING pattern (new way) - allows concurrent execution
// Empirica.on("player", "testTriggerNonBlocking", (ctx, { player }) => {
//   if (!player.get("testTriggerNonBlocking")) return;
//   
//   // Prevent duplicates
//   if (player.round.get("testProcessing")) {
//     console.log(`[NON-BLOCKING TEST] Already processing for player ${player.id}`);
//     return;
//   }
//   
//   player.round.set("testProcessing", true);
//   
//   const startTime = Date.now();
//   const serverStartTime = player.currentStage.get("serverStartTime");
//   const relativeTime = serverStartTime ? startTime - serverStartTime : startTime;
//   
//   console.log(`[NON-BLOCKING TEST] Callback started for player ${player.id} at ${relativeTime}ms`);
//   
//   // Background processing function
//   async function processTest() {
//     try {
//       const response = await dummyAPICall(player.id, 5000);
//       
//       player.stage.set("testResponse", {
//         response: response,
//         timestamp: Date.now(),
//         playerId: player.id
//       });
//       
//       console.log(`[NON-BLOCKING TEST] Response set for player ${player.id}: ${response}`);
//     } catch (error) {
//       console.error(`[NON-BLOCKING TEST] Error for player ${player.id}:`, error);
//     } finally {
//       player.set("testTriggerNonBlocking", false);
//       player.round.set("testProcessing", false);
//       Empirica.flush();
//       console.log(`[NON-BLOCKING TEST] Processing completed for player ${player.id}`);
//     }
//   }
//   
//   // Start background processing - callback returns immediately
//   processTest();
//   
//   console.log(`[NON-BLOCKING TEST] Callback completed immediately for player ${player.id} - processing in background`);
// });

// ============ END TESTING CALLBACKS ============

// Text normalization function - matches client-side normalization
function normalizeString(str) {
  return str.trim().toLowerCase().replace(/[\s\-',.]+/g, ''); // Remove spaces, hyphens, apostrophes, commas, periods and convert to lowercase
}

// Exact agent name mapping - has to correspond to agent names defined in SFTplayground yaml files
const AGENT_NAMES = {
  'adjacent': {
      'animals': 'adjacentAnimals',
      'clothing items': 'adjacentClothes',
      // // === VIDEO RECORDING SETUP - REMOVE BEFORE DEPLOYMENT ===
      // 'fruits': 'adjacentFruits'  // Added for human-human video recording demo
      // // === END VIDEO RECORDING SETUP ===
  },
  'divergent': {
      'animals': 'divergentAnimals',
      'clothing items': 'divergentClothes',
      // // === VIDEO RECORDING SETUP - REMOVE BEFORE DEPLOYMENT ===
      // 'fruits': 'divergentFruits'  // Added for human-human video recording demo
      // // === END VIDEO RECORDING SETUP ===
  },
  'inferred': {
      'animals': 'inferredAnimals',
      'clothing items': 'inferredClothes',
      // // === VIDEO RECORDING SETUP - REMOVE BEFORE DEPLOYMENT ===
      // 'fruits': 'inferredFruits'  // Added for human-human video recording demo
      // // === END VIDEO RECORDING SETUP ===
  }
};

function getAgentName(cueType, category) {
  return AGENT_NAMES[cueType][category];
}

function setupRounds(game, treatment) {
  const { cueType, interOrder } = treatment;
  const players = game.players;
  
  // // Add AsyncTest as the first round for testing callback patterns
  // const testRound = game.addRound({ name: "AsyncTestRound" });
  // testRound.addStage({ name: "AsyncTest", duration: 60 }); // 1 minute for testing
  // console.log("AsyncTest round created as first round");
  
  const [firstTask, secondTask] = interOrder.split('_');
  
  const interleavedRound1 = game.addRound({ name: "Interleaved1" });
  interleavedRound1.addStage({ name: firstTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 20 }); //180
  interleavedRound1.addStage({ name: "SwitchesId", duration: 300 });
  interleavedRound1.addStage({ name: "Labelling", duration: 300 });
  interleavedRound1.set("category", categoryMap[firstTask.slice(-1)]);
  console.log("interleavedRound1 category set to", categoryMap[firstTask.slice(-1)]); 
  interleavedRound1.set("treatment", treatment);  // Set treatment for the round

  const interleavedRound2 = game.addRound({ name: "Interleaved2" });
  interleavedRound2.addStage({ name: secondTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 20 });
  interleavedRound2.addStage({ name: "SwitchesId", duration: 300 });
  interleavedRound2.addStage({ name: "Labelling", duration: 300 });
  interleavedRound2.set("category", categoryMap[secondTask.slice(-1)]);
  console.log("interleavedRound2 category set to", categoryMap[secondTask.slice(-1)]);
  interleavedRound2.set("treatment", treatment);  // Set treatment for the round

  game.set("cueType", cueType);
  game.set("taskType", "interleaved");
}

// function gaussianRandom(mean, standardDeviation, min, max) {
//   // Generate two independent uniform random numbers
//   const u = Math.random();
//   const v = Math.random();
  
//   // Transform to standard normal distribution using Box-Muller
//   const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  
//   // Transform to desired mean and standard deviation
//   let result = normal * standardDeviation + mean;
  
//   // Clamp the result between min and max
//   return Math.min(Math.max(result, min), max);
// }


Empirica.onGameStart(({ game }) => {
  const treatment = game.get("treatment");
  const players = game.players;
  setupRounds(game, treatment);
  console.log(`Game ${game.id} rounds set up for treatment:`, treatment);

  const [firstTask, secondTask] = treatment.interOrder.split('_');
  
  const taskIndex = [
    firstTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab",
    secondTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab"
  ];
  
  const taskCategory = [
    categoryMap[firstTask.slice(-1)],
    categoryMap[secondTask.slice(-1)]
  ];

  game.set("taskIndex", taskIndex);
  game.set("taskCategory", taskCategory);
  game.set("currentRoundIndex", 0);  // Initialize round counter
  game.set("hhRoundIndex", 0);       // Initialize HH round counter

  players.forEach((player) => {
    player.set("slowResponsePenalties", 0);
  });

  console.log(`Task Index set for game ${game.id}:`, taskIndex);
  console.log(`Task Category set for game ${game.id}:`, taskCategory);
});



Empirica.onRoundStart(({ round }) => {
  const game = round.currentGame;
  const players = game.players;
  const treatment = game.get("treatment");
  const taskIndex = game.get("taskIndex");
  const taskCategory = game.get("taskCategory");
  const currentRoundIndex = game.get("currentRoundIndex");

  console.log(`Round ${round.get("name")} started for game ${game.id}`);
  console.log(`Current round index: ${currentRoundIndex}`);
  console.log(`Task Index for game ${game.id}:`, taskIndex);
  console.log(`Task Category for game ${game.id}:`, taskCategory);

  const category = taskCategory[currentRoundIndex];
  console.log(`Category for round ${round.get("name")}: ${category}`);
  
  round.set("category", category);

  // initialize agents for LLM rounds
  if (round.get("name").startsWith("Interleaved") && taskIndex[currentRoundIndex] === "VerbalFluencyCollab") {
  
  // Get agent name based on treatment and category
  const agentName = getAgentName(treatment.cueType, category);
  
  players.forEach(async (player) => {
      try {
          // Create a unique session ID
          const sessionId = `${player.id}-${player.currentRound.id}`;
          
          console.log(`Initializing agent ${agentName} for player ${player.id}, session ${sessionId}`);
          
          await client.initAgent(
              agentName,
              sessionId,
              player.id
          );
          
          console.log(`Agent initialization successful for player ${player.id}`);
      } catch (error) {
          console.error(`Agent initialization failed for player ${player.id}:`, error);
      }
  });
}

  players.forEach((player, playerArrayIndex) => {
    player.round.set("category", category);
    player.round.set("cueType", treatment.cueType);
    player.round.set("taskType", treatment.taskType);
    player.round.set("currentRoundIndex", currentRoundIndex);

    // Set partner information for interleaved rounds
    const currentTask = taskIndex[currentRoundIndex];
    if (currentTask === "HHInterleaved") {
      const partner = players.find(p => p.id !== player.id);
      player.round.set("partner", partner.id);
    } else if (currentTask === "VerbalFluencyCollab") {
      player.round.set("partner", "AI");
    }

    // Set roles for HH interleaved rounds
    if (taskIndex[currentRoundIndex] === "HHInterleaved") {
      const hhRoundIndex = game.get("hhRoundIndex") || 0;
      
      console.log(`Role assignment debug:
        Round name: ${round.get("name")}
        HH Round Index: ${hhRoundIndex}
        Player Array Index: ${playerArrayIndex}
        Current round index: ${currentRoundIndex}
      `);

      // Set role based on hhRoundIndex (alternating)
      const mainRole = hhRoundIndex % 2 === 0 ? 
        (playerArrayIndex === 0 ? "main" : "helper") : 
        (playerArrayIndex === 0 ? "helper" : "main");
      
      player.round.set("role", mainRole);
      player.set("role", mainRole);
      
      // Only increment hhRoundIndex after processing all players
      if (playerArrayIndex === players.length - 1) {
        game.set("hhRoundIndex", hhRoundIndex + 1);
      }
      
      console.log(`Final role assignment:
        Player ID: ${player.id}
        Player Array Index: ${playerArrayIndex}
        HH Round: ${hhRoundIndex}
        Round Name: ${round.get("name")}
        Role: ${mainRole}
      `);
    }
  });

  if (round.get("name").includes("Interleaved")) {
    const firstPlayerId = players[Math.floor(Math.random() * players.length)].id;
    round.set("currentTurnPlayerId", firstPlayerId);
  }
});

Empirica.onStageStart(({ stage }) => {
  const startTime = Date.now();
  stage.set("serverStartTime", startTime);
  console.log(`Server start time set for stage ${stage.get("name")} at ${startTime} for game ${stage.currentGame.id}`);
  
  if (!stage) {
    console.error("Stage is undefined in onStageStart");
    return;
  }
  
  const stageName = stage.get("name");
  const game = stage.currentGame;
  const treatment = game.get("treatment");
  console.log(`Stage ${stageName} started for game ${game.id}. Treatment:`, treatment);
  
  // Initialize turn state for VerbalFluencyCollab stages
  if (stageName === "VerbalFluencyCollab") {
    const round = stage.round;
    round.set("currentTurn", "user");
    console.log(`Initialized AI turn state for round ${round.id}: user's turn`);
  }
});

Empirica.onStageEnded(({ stage }) => {
  if (!stage) {
    console.error("Stage is undefined in onStageEnded");
    return;
  }
  const stageName = stage.get("name");
  console.log(`${stageName} stage ended for game ${stage.currentGame.id}`);

  // For stages that generate words
  wordStages = ["HHInterleaved", "VerbalFluencyCollab"];

  if (wordStages.includes(stageName)) {
    const round = stage.round;
    const players = stage.currentGame.players;
    
    players.forEach(player => {
      // If the words are in round, copy them to player.round
      if (round.get("words")) {
        player.round.set("words", round.get("words"));
      }
      // If they're already in player.round (AI case), they're already saved correctly
    });
  }
});

Empirica.onRoundEnded(({ round }) => {
  const game = round.currentGame;
  const currentRoundIndex = game.get("currentRoundIndex");

  // Increment the round counter for next round
  
  game.set("currentRoundIndex", currentRoundIndex + 1);
  console.log(`Round ${round.get("name")} ended. New round index: ${currentRoundIndex + 1}`);
  // Add score to player's cumulative score
  game.players.forEach((player) => {
    // Get current cumulative score
    const currentScore = player.get("score") || 0;
    // Get the round score
    const roundScore = player.round.get("score") || 0;
    // Update cumulative score
    player.set("score", currentScore + roundScore);
    
    console.log(`Updated cumulative score for player ${player.id}:
      Previous score: ${currentScore}
      Round score: ${roundScore}
      New total: ${currentScore + roundScore}`);
  });
});

Empirica.onGameEnded(({ game }) => {
  console.log(`Game ${game.id} ended`);
  const taskType = game.get("taskType");
  const taskIndices = game.get("taskIndex");
  const taskCategories = game.get("taskCategory");
  console.log(`Task type: ${taskType}, taskIndices: ${taskIndices}, taskCategories: ${taskCategories}`);

  // Calculate final bonus based on total score
  game.players.forEach(player => {
    const totalScore = player.get("score") || 0;
    const bonusRate = 0.02; // £0.02 per word
    const penalties = player.get("slowResponsePenalties") || 0;
    const penaltiesRate = 0.01; // £0.01 penalty for slow responses
    const bonusAmount = (totalScore * bonusRate) - (penalties * penaltiesRate);
    player.set("bonusAmount", bonusAmount);
    
    // Store existing task metadata
    player.set("taskType", taskType);
    player.set("taskIndices", taskIndices);
    player.set("taskCategories", taskCategories);
    player.set("requestTimestamp", false);
    
    console.log(`Game ended; player ${player.id}:
      Total Score: ${totalScore} words
      Penalties: ${penalties} slow responses  
      Bonus: £${bonusAmount.toFixed(2)}
      Task type, indices, and categories recorded and requestTimestamp reset`);
  });
});

// API call with retries for duplicated words
Empirica.on("player", "apiTrigger", (ctx, { player }) => {
  if (!player.get("apiTrigger")) {
      console.log("API trigger is false, skipping API call");
      return;
  }

  // Prevent concurrent API calls for same player
  if (player.round.get("apiProcessing")) {
      console.log(`API already processing for player ${player.id}, skipping duplicate call`);
      return;
  }

  // Set processing flag to prevent duplicates
  player.round.set("apiProcessing", true);

  // Get all data we need immediately
  const sessionId = `${player.id}-${player.currentRound.id}`;
  const treatment = player.currentGame.get("treatment");
  const category = player.round.get("category");
  const requestTime = Date.now();
  const serverStartTime = player.currentStage.get("serverStartTime");
  const serverRelativeTime = serverStartTime ? requestTime - serverStartTime : null;
  const agentName = getAgentName(treatment.cueType, category);
  const pastWords = player.round.get("words") || [];
  const lastWord = pastWords.length > 0 ? pastWords[pastWords.length - 1].text : "";

  console.log(`[TIMING] Server callback fired at: ${requestTime} (relative: ${serverRelativeTime}ms)`);
  console.log(`Using agent: ${agentName} for category: ${category}, cueType: ${treatment.cueType}`);

  // Store callback timing immediately (non-blocking)
  player.round.set("serverCallbackTime", serverRelativeTime);

  // Create async function for API processing
  async function processAPICall() {
      let attempts = 0;
      const maxAttempts = 3;
      let responseText = "";
      let isDuplicate = true;
      let duplicateWords = [];
      
      try {
          // Try up to maxAttempts times to get a non-duplicate word
          while (isDuplicate && attempts < maxAttempts) {
              attempts++;
              console.log(`AI response attempt #${attempts} for player ${player.id}`);

              let userPrompt = `It's your turn. Last word: ${lastWord}`;
              if (duplicateWords.length > 0) {
                userPrompt += `. Please suggest a different word. The following words were already used: ${duplicateWords.join(", ")}`;
              }

              console.log(`Making API call for player ${player.id}, session ${sessionId}`);
              
              // Timing checkpoint before API call
              const preApiTime = serverStartTime ? Date.now() - serverStartTime : null;
              player.round.set("preApiCallTime", preApiTime);
              console.log(`[TIMING] About to start API call at: ${preApiTime}ms`);
              
              responseText = await client.generateWithRetry(
                  userPrompt,
                  agentName,
                  sessionId,
                  player.id,
                  3  // maxRetries
              );
              
              // Timing checkpoint after API call
              const postApiTime = serverStartTime ? Date.now() - serverStartTime : null;
              player.round.set("postApiCallTime", postApiTime);
              console.log(`[TIMING] API call completed at: ${postApiTime}ms, took: ${postApiTime - preApiTime}ms`);

              // Trim response text
              responseText = responseText.trim();
              
              // Check if this response is a duplicate
              const normalizedResponse = normalizeString(responseText);
              isDuplicate = pastWords.some(w => 
                  normalizeString(w.text) === normalizedResponse
              );
              
              if (isDuplicate) {
                  duplicateWords.push(responseText);
                  console.log(`Duplicate AI response detected: "${responseText}". Retrying...`);
              } else {
                  console.log(`Non-duplicate AI response received: "${responseText}"`);
              }
          }

          // If all attempts resulted in duplicates, log this but still use the last response
          if (isDuplicate) {
              console.log(`Warning: Used duplicate response "${responseText}" after ${maxAttempts} attempts`);
          }

          // Set the successful response
          const responseTime = Date.now();
          const preResponseSetTime = serverStartTime ? responseTime - serverStartTime : null;
          player.round.set("preResponseSetTime", preResponseSetTime);
          console.log(`[TIMING] About to set API response at: ${preResponseSetTime}ms`);
          
          player.stage.set("apiResponse", {
              text: responseText,
              timestamp: responseTime,
              apiLatency: responseTime - requestTime
          });
          
          const postResponseSetTime = serverStartTime ? Date.now() - serverStartTime : null;
          player.round.set("postResponseSetTime", postResponseSetTime);
          console.log(`[TIMING] API response set completed at: ${postResponseSetTime}ms, took: ${postResponseSetTime - preResponseSetTime}ms`);
          console.log(`API response processed and set for player ${player.id}:`, responseText);
          
      } catch (error) {
          console.error(`API call failed for player ${player.id}:`, error);
          
          // Categorize error types
          const errorType = error.message?.includes('HTTP error') ? 'HTTP' :
                           error.message?.includes('timeout') ? 'TIMEOUT' :
                           error.message?.includes('network') ? 'NETWORK' : 'UNKNOWN';

          player.stage.set("apiError", {
              message: error.message,
              type: errorType,
              timestamp: Date.now(),
              playerId: player.id,
              sessionId: sessionId
          });

          console.error(`[API ERROR] Player: ${player.id}, Session: ${sessionId}, Type: ${errorType}, Message: ${error.message}`);
      } finally {
          // Clean up both flags
          player.set("apiTrigger", false);
          player.round.set("apiProcessing", false);
          Empirica.flush();
          console.log(`[TIMING] API processing completed and flags cleared for player ${player.id}`);
      }
  }

  // Start the API processing asynchronously - callback returns immediately!
  processAPICall();

  console.log(`[TIMING] Callback completed for player ${player.id} - API processing started in background`);
});

Empirica.on("player", "requestTimestamp", async (ctx, { player }) => {
  console.log(`[Timestamp Service] New request from player ${player.id}`);
  console.log(`[Timestamp Service] Current stage: ${player.currentStage.get("name")}`);
  console.log(`[Timestamp Service] Current timestamp: ${player.stage.get("serverTimestamp")}`);

  //only update timestamp if requestTimestamp = true!
  if (!player.get("requestTimestamp")) {
    console.log(`[Timestamp Service] Request flag is false for player ${player.id}. Skipping update.`);
    return;
  }
  
  const timestamp = Date.now();
  
  await player.stage.set("serverTimestamp", timestamp);
  await player.set("requestTimestamp", false);
  await Empirica.flush();

  // Debugging - verify the timestamp was set correctly
  const verifyTimestamp = player.stage.get("serverTimestamp");
  console.log(`[Timestamp Service] Response for ${player.id}:`, {
    set: timestamp,
    verified: verifyTimestamp,
    match: timestamp === verifyTimestamp
  });
});

// Server-side turn validation for both HHInterleaved and VerbalFluencyCollab
// Server-side turn validation for both HHInterleaved and VerbalFluencyCollab
Empirica.on("round", "words", (ctx, { round }) => {
  const stageName = round.currentStage?.get("name");
  
  // Background validation function to avoid blocking other callbacks
  async function validateTurns() {
    try {
      // Handle HHInterleaved (human-human turns)
      if (stageName === "HHInterleaved") {
        const words = round.get("words") || [];
        const currentTurn = round.get("currentTurnPlayerId");
        
        console.log(`[HH Turn Validation] Words updated in round ${round.id}. Word count: ${words.length}, Current turn: ${currentTurn}`);
        
        // Check if last word violates turn order (consecutive words from same player)
        if (words.length >= 2) {
          const lastWord = words[words.length - 1];
          const secondLastWord = words[words.length - 2];
          
          if (lastWord.player === secondLastWord.player) {
            console.log(`[HH Turn Validation] VIOLATION DETECTED: Player ${lastWord.player} submitted consecutive words`);
            console.log(`[HH Turn Validation] Last word: "${lastWord.text}", Second last: "${secondLastWord.text}"`);
            
            // Remove the invalid word
            const correctedWords = words.slice(0, -1);
            console.log(`[HH Turn Validation] Removing invalid word. New word count: ${correctedWords.length}`);
            
            // Get the other player
            const players = round.currentGame.players;
            const otherPlayer = players.find(p => p.id !== lastWord.player);
            
            if (!otherPlayer) {
              console.error(`[HH Turn Validation] Could not find other player for ${lastWord.player}`);
              return;
            }
            
            // Atomic correction: remove invalid word and set correct turn
            round.set("words", correctedWords);
            round.set("currentTurnPlayerId", otherPlayer.id);
            Empirica.flush();
            
            console.log(`[HH Turn Validation] Corrected turn violation. Turn reset to: ${otherPlayer.id}`);
            return;
          }
        }
        
        // If we have words, validate the current turn matches the last word's player
        if (words.length > 0) {
          const lastWord = words[words.length - 1];
          const players = round.currentGame.players;
          const otherPlayer = players.find(p => p.id !== lastWord.player);
          
          if (!otherPlayer) {
            console.error(`[HH Turn Validation] Could not find other player for ${lastWord.player}`);
            return;
          }
          
          // The turn should now belong to the other player
          if (currentTurn !== otherPlayer.id) {
            console.log(`[HH Turn Validation] Turn mismatch detected. Last word by: ${lastWord.player}, but turn is: ${currentTurn}. Setting turn to: ${otherPlayer.id}`);
            round.set("currentTurnPlayerId", otherPlayer.id);
            Empirica.flush();
          }
        }
      }
      
      // Handle VerbalFluencyCollab (human-AI turns)
      else if (stageName === "VerbalFluencyCollab") {
        const words = round.get("words") || [];
        const currentTurn = round.get("currentTurn"); // "user" or "ai"
        
        console.log(`[AI Turn Validation] Words updated in round ${round.id}. Word count: ${words.length}, Current turn: ${currentTurn}`);
        
        // Check for consecutive user words (violation!)
        if (words.length >= 2) {
          const lastWord = words[words.length - 1];
          const secondLastWord = words[words.length - 2];
          
          if (lastWord.source === 'user' && secondLastWord.source === 'user') {
            console.log(`[AI Turn Validation] VIOLATION DETECTED: Consecutive user words`);
            console.log(`[AI Turn Validation] Last word: "${lastWord.text}", Second last: "${secondLastWord.text}"`);
            
            // Remove the duplicate user word
            const correctedWords = words.slice(0, -1);
            console.log(`[AI Turn Validation] Removing invalid user word. New word count: ${correctedWords.length}`);
            
            // Atomic correction: remove invalid word and set correct turn
            round.set("words", correctedWords);
            round.set("currentTurn", "ai"); // It should be AI's turn after user word
            Empirica.flush();
            
            console.log(`[AI Turn Validation] Corrected turn violation. Turn reset to: ai`);
            return;
          }
        }
        
        // Set correct turn based on last word
        if (words.length > 0) {
          const lastWord = words[words.length - 1];
          const expectedTurn = lastWord.source === 'user' ? 'ai' : 'user';
          
          if (currentTurn !== expectedTurn) {
            console.log(`[AI Turn Validation] Turn mismatch detected. Last word by: ${lastWord.source}, but turn is: ${currentTurn}. Setting turn to: ${expectedTurn}`);
            round.set("currentTurn", expectedTurn);
            Empirica.flush();
          }
        } else {
          // No words yet, should be user's turn
          if (currentTurn !== "user") {
            console.log(`[AI Turn Validation] No words yet, setting turn to: user`);
            round.set("currentTurn", "user");
            Empirica.flush();
          }
        }
      }
    } catch (error) {
      console.error(`[Turn Validation] Error in background validation:`, error);
    }
  }
  
  // Start validation in background - callback returns immediately
  validateTurns();
  
  console.log(`[Turn Validation] Callback completed immediately for round ${round.id} - validation running in background`);
});