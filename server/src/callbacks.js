import { ClassicListenersCollector } from "@empirica/core/admin/classic";
import { SFTClient } from "./utils/SFTClient";

export const Empirica = new ClassicListenersCollector();

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
  
  // // Add TimestampTest as the first round for testing timestamp anomalies
  // const timestampTestRound = game.addRound({ name: "TimestampTestRound" });
  // timestampTestRound.addStage({ name: "TimestampTest", duration: 300 }); // 5 minutes for testing
  // console.log("TimestampTest round created as first round");
  
  const [firstTask, secondTask] = interOrder.split('_');
  
  const interleavedRound1 = game.addRound({ name: "Interleaved1" });
  interleavedRound1.addStage({ name: firstTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 360 }); //180
  interleavedRound1.addStage({ name: "SwitchesId", duration: 300 });
  interleavedRound1.addStage({ name: "Labelling", duration: 300 });
  interleavedRound1.set("category", categoryMap[firstTask.slice(-1)]);
  console.log("interleavedRound1 category set to", categoryMap[firstTask.slice(-1)]); 
  interleavedRound1.set("treatment", treatment);  // Set treatment for the round

  const interleavedRound2 = game.addRound({ name: "Interleaved2" });
  interleavedRound2.addStage({ name: secondTask.startsWith('h') ? "HHInterleaved" : "VerbalFluencyCollab", duration: 360 });
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

  });

  // Set random first player for HHInterleaved rounds
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
  
  // HHInterleaved turn state is initialized in onRoundStart callback
  // VerbalFluencyCollab turns are managed in the words callback
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

// Words-triggered API call - only for VerbalFluencyCollab stage  
Empirica.on("player", "words", (ctx, { player, words }) => {
  const stageName = player.currentStage?.get("name");
  
  // Only trigger API for VerbalFluencyCollab stage
  if (stageName !== "VerbalFluencyCollab") {
    return;
  }
  
  // Use words from callback parameter (recommended by Empirica docs)
  if (!words) words = [];
  
  // Add server timestamp to the last word if it's a user word without serverTimestamp
  let wordsToSave = words;
  if (words.length > 0) {
    const lastWordIndex = words.length - 1;
    const lastWord = words[lastWordIndex];
    
    if (lastWord.source === 'user' && !lastWord.timestamp) {
      wordsToSave = [...words];
      wordsToSave[lastWordIndex] = {
        ...lastWord,
        timestamp: Date.now()
      };
      console.log(`[SERVER TIMESTAMP] Player ${player.id} added server timestamp to user word "${lastWord.text}"`);
    }
  }
  
  // Copy to player.round.words for compatibility with other code
  player.round.set("words", wordsToSave);

  // Only trigger API if last word is from user
  if (words.length === 0) return;

  const lastWordObj = words[words.length - 1];
  if (lastWordObj.source !== 'user') {
    console.log(`[Words Update] Player ${player.id} last word is AI, skipping trigger`);
    return;
  }

  // Check if we're already processing
  if (player.round.get("apiProcessing")) {
    console.log(`[Words Update] Player ${player.id} already processing, skipping`);
    return;
  }

  // This is a user word - trigger API
  console.log(`[Words Update] Player ${player.id} user word "${lastWordObj.text}" triggering API`);

  // Set processing flag and start API call
  player.round.set("apiProcessing", true);
  console.log(`[SERVER API START] Player ${player.id} starting API call`);

  // Get required data immediately
  const sessionId = `${player.id}-${player.currentRound.id}`;
  const treatment = player.currentGame.get("treatment");
  const category = player.round.get("category");
  const agentName = getAgentName(treatment.cueType, category);
  
  console.log(`[SERVER DATA] Player ${player.id} sessionId: ${sessionId}, category: ${category}, agentName: ${agentName}`);
  
  // Use words from callback parameter (fresh data that triggered this callback)
  const pastWords = words;
  console.log(`[SERVER WORDS ARRAY] Player ${player.id} pastWords:`, pastWords.map(w => `${w.source}:"${w.text}"`));
  console.log(`[SERVER WORDS ARRAY] Player ${player.id} pastWords.length: ${pastWords.length}`);
  
  // The last word should always be the user's word that triggered this API call
  const lastWord = lastWordObj.text; // Same word that triggered this callback
  console.log(`[SERVER LAST WORD] Player ${player.id} lastWord: "${lastWord}"`);
  
  if (pastWords.length > 0) {
    console.log(`[SERVER LAST WORD DETAILS] Player ${player.id} last word object:`, {
      text: lastWordObj.text,
      source: lastWordObj.source,
      timestamp: lastWordObj.timestamp
    });
  }
  
  const requestTime = Date.now();
  console.log(`[SERVER TIMING] Player ${player.id} request time: ${requestTime}`);

  // Background processing function
  function processAPICall() {
    let attempts = 0;
    const maxAttempts = 3;
    let responseText = "";
    let duplicateWords = [];

    // Recursive function to handle retries
    function makeAPICall() {
      attempts++;
      console.log(`[SERVER API ATTEMPT] Player ${player.id} attempt ${attempts}/${maxAttempts}`);

      let userPrompt = `It's your turn. Last word: ${lastWord}`;
      console.log(`[SERVER PROMPT BASE] Player ${player.id} base prompt: "${userPrompt}"`);
      
      if (duplicateWords.length > 0) {
        const duplicateAddition = `. Please suggest a different word. Already used: ${duplicateWords.join(", ")}`;
        userPrompt += duplicateAddition;
        console.log(`[SERVER PROMPT DUPLICATE] Player ${player.id} added duplicate text: "${duplicateAddition}"`);
      }
      
      console.log(`[SERVER PROMPT FINAL] Player ${player.id} final prompt: "${userPrompt}"`);
      console.log(`[SERVER API CALL] Player ${player.id} calling client.generate`);

      client.generate(userPrompt, agentName, sessionId, player.id)
        .then(response => {
          console.log(`[SERVER API RESPONSE] Player ${player.id} raw response: "${response}"`);
          responseText = response.trim();
          console.log(`[SERVER API RESPONSE] Player ${player.id} trimmed response: "${responseText}"`);
          
          // Check for duplicate words
          const normalizedResponse = normalizeString(responseText);
          console.log(`[SERVER DUPLICATE CHECK] Player ${player.id} normalized response: "${normalizedResponse}"`);
          
          const isDuplicate = pastWords.some(w => {
            const normalizedExisting = normalizeString(w.text);
            const matches = normalizedExisting === normalizedResponse;
            if (matches) {
              console.log(`[SERVER DUPLICATE MATCH] Player ${player.id} "${normalizedResponse}" matches existing "${normalizedExisting}" from "${w.text}"`);
            }
            return matches;
          });
          
          console.log(`[SERVER DUPLICATE RESULT] Player ${player.id} isDuplicate: ${isDuplicate}, attempts: ${attempts}/${maxAttempts}`);

          if (isDuplicate && attempts < maxAttempts) {
            duplicateWords.push(responseText);
            console.log(`[SERVER DUPLICATE RETRY] Player ${player.id} duplicate: "${responseText}", retrying`);
            
            // Log repeated LLM words
            const repeatedWords = player.round.get("repeatedLLMWords") || [];
            const updatedRepeatedWords = [...repeatedWords, responseText];
            player.round.set("repeatedLLMWords", updatedRepeatedWords);
            console.log(`[SERVER REPEATED WORDS] Player ${player.id} updated repeated words:`, updatedRepeatedWords);
            
            makeAPICall(); // Retry
            return;
          }

          // Success or max attempts reached
          const responseTime = Date.now();
          const apiLatency = responseTime - requestTime;
          
          console.log(`[SERVER SUCCESS] Player ${player.id} final response: "${responseText}"`);
          console.log(`[SERVER TIMING] Player ${player.id} API latency: ${apiLatency}ms`);
          
          const apiResponseObj = {
            text: responseText,
            timestamp: responseTime,
            apiLatency: apiLatency
          };
          
          console.log(`[SERVER SET RESPONSE] Player ${player.id} setting apiResponse:`, apiResponseObj);
          player.stage.set("apiResponse", apiResponseObj);
          
          console.log(`[SERVER FLUSH RESPONSE] Player ${player.id} flushing API response`);
          Empirica.flush(); // Flush API response immediately for client
          console.log(`[SERVER FLUSH COMPLETE] Player ${player.id} response flush completed`);
          
          if (isDuplicate) {
            console.log(`[SERVER FINAL DUPLICATE] Player ${player.id} used duplicate "${responseText}" after ${maxAttempts} attempts`);
            const repeatedWords = player.round.get("repeatedLLMWords") || [];
            const updatedRepeatedWords = [...repeatedWords, responseText];
            player.round.set("repeatedLLMWords", updatedRepeatedWords);
            console.log(`[SERVER FINAL REPEATED] Player ${player.id} final repeated words:`, updatedRepeatedWords);
          }
        })
        .catch(error => {
          console.error(`[SERVER API ERROR] Player ${player.id} error:`, error.message);
          console.error(`[SERVER API ERROR] Player ${player.id} full error:`, error);
          
          // Log error
          const errors = player.round.get("apiErrors") || [];
          const newError = {
            message: error.message,
            timestamp: Date.now(),
            attempt: attempts
          };
          const updatedErrors = [...errors, newError];
          
          console.log(`[SERVER ERROR LOG] Player ${player.id} logging error:`, newError);
          player.round.set("apiErrors", updatedErrors);
          
          // Mark the failed interaction for analysis
          const words = player.round.get("words") || [];
          console.log(`[SERVER ERROR ANALYSIS] Player ${player.id} words for failed interaction:`, words.map(w => `${w.source}:"${w.text}"`));
          
          const lastUserWord = words.length > 0 ? words[words.length - 1] : null;
          console.log(`[SERVER ERROR ANALYSIS] Player ${player.id} lastUserWord:`, lastUserWord);
          
          if (lastUserWord && lastUserWord.source === 'user') {
            const failedInteractions = player.round.get("failedAPIInteractions") || [];
            const failedInteraction = {
              userWord: lastUserWord.text,
              userTimestamp: lastUserWord.timestamp,
              errorMessage: error.message,
              errorType: error.message?.includes('timeout') ? 'TIMEOUT' : 'API_ERROR',
              failureTimestamp: Date.now(),
              attempt: attempts,
              sessionId: sessionId
            };
            
            const updatedFailedInteractions = [...failedInteractions, failedInteraction];
            player.round.set("failedAPIInteractions", updatedFailedInteractions);
            
            console.log(`[SERVER FAILED INTERACTION] Player ${player.id} logged:`, failedInteraction);
          }
          
          const apiErrorObj = {
            message: error.message,
            type: error.message?.includes('timeout') ? 'TIMEOUT' : 'API_ERROR',
            timestamp: Date.now()
          };
          
          console.log(`[SERVER SET ERROR] Player ${player.id} setting apiError:`, apiErrorObj);
          player.stage.set("apiError", apiErrorObj);
          
          console.log(`[SERVER FLUSH ERROR] Player ${player.id} flushing API error`);
          Empirica.flush(); // Flush error immediately for client
          console.log(`[SERVER ERROR FLUSH COMPLETE] Player ${player.id} error flush completed`);
        })
        .finally(() => {
          console.log(`[SERVER CLEANUP] Player ${player.id} starting cleanup`);
          
          console.log(`[SERVER CLEANUP] Player ${player.id} setting apiProcessing = false`);
          player.round.set("apiProcessing", false);
          
          console.log(`[SERVER CLEANUP] Player ${player.id} flushing cleanup flags`);
          Empirica.flush();
          
          console.log(`[SERVER COMPLETE] Player ${player.id} processing complete`);
        });
    }

    makeAPICall();
  }

  // Start background processing
  processAPICall();
});

Empirica.on("player", "requestTimestamp", (ctx, { player }) => {
  console.log(`[Timestamp Service] New request from player ${player.id}`);
  console.log(`[Timestamp Service] Current stage: ${player.currentStage.get("name")}`);
  console.log(`[Timestamp Service] Current timestamp: ${player.stage.get("serverTimestamp")}`);

  //only update timestamp if requestTimestamp = true!
  if (!player.get("requestTimestamp")) {
    console.log(`[Timestamp Service] Request flag is false for player ${player.id}. Skipping update.`);
    return;
  }
  
  // Background processing for timestamp update
  async function updateTimestamp() {
    const timestamp = Date.now();
    
    await player.stage.set("serverTimestamp", timestamp);
    await player.set("requestTimestamp", false);
    await Empirica.flush();
  }
  
  updateTimestamp();

  // Debugging - verify the timestamp was set correctly
  const verifyTimestamp = player.stage.get("serverTimestamp");
  console.log(`[Timestamp Service] Response for ${player.id}:`, {
    set: timestamp,
    verified: verifyTimestamp,
    match: timestamp === verifyTimestamp
  });
});

// Test callback for timestamp anomaly investigation
// Empirica.on("player", "testTimestampRequest", (ctx, { player }) => {
//   console.log(`[TEST TIMESTAMP] Player ${player.id} requested test timestamp`);
//   
//   // Non-blocking async function to simulate AI response timing
//   async function createTestResponse() {
//     try {
//       console.log(`[TEST TIMESTAMP] Player ${player.id} starting test response creation`);
//       
//       // Simulate variable API delay like the real AI calls
//       const delay = Math.random() * 1000 + 500; // 500-1500ms delay
//       console.log(`[TEST TIMESTAMP] Player ${player.id} simulating ${delay}ms delay`);
//       
//       await new Promise(resolve => setTimeout(resolve, delay));
//       
//       // Create server timestamp (like responseTime = Date.now() in the real callback)
//       const serverTimestamp = Date.now();
//       console.log(`[TEST TIMESTAMP] Player ${player.id} server timestamp created: ${serverTimestamp}`);
//       
//       // Create test response object (like apiResponseObj in real callback)
//       const testResponseObj = {
//         text: `test-response-${Date.now()}`,
//         timestamp: serverTimestamp,
//         delay: delay,
//         testType: 'timestamp-investigation'
//       };
//       
//       console.log(`[TEST TIMESTAMP] Player ${player.id} setting testResponse:`, testResponseObj);
//       player.stage.set("testResponse", testResponseObj);
//       
//       console.log(`[TEST TIMESTAMP] Player ${player.id} flushing test response`);
//       Empirica.flush();
//       console.log(`[TEST TIMESTAMP] Player ${player.id} test response complete`);
//       
//     } catch (error) {
//       console.error(`[TEST TIMESTAMP ERROR] Player ${player.id}:`, error);
//       player.stage.set("testResponseError", {
//         error: error.message,
//         timestamp: Date.now()
//       });
//       Empirica.flush();
//     }
//   }
//   
//   // Start background processing (non-blocking)
//   createTestResponse();
// });

// HHInterleaved round words callback - add server timestamps and validate turns
Empirica.on("round", "words", (ctx, { round, words }) => {

  const stageName = round.currentGame.currentStage?.get("name");
  console.log(`[HH CALLBACK] Processing words for round ${round.id} in stage ${stageName}`);
  
  // Only process HHInterleaved words (human-human)
  if (stageName === "HHInterleaved") {
    // Use words from callback parameter (recommended by Empirica docs)
    if (!words) words = [];
    
    // Add server timestamp to the last word if it doesn't have one
    if (words.length > 0) {
      const lastWordIndex = words.length - 1;
      const lastWord = words[lastWordIndex];

      console.log(`[HH DEBUG] Callback triggered, lastWord:`, lastWord);
      console.log(`[HH DEBUG] lastWord.timestamp:`, lastWord.timestamp);
      console.log(`[HH DEBUG] !lastWord.timestamp:`, !lastWord.timestamp);

      
      if (!lastWord.timestamp) {
        const wordsWithServerTimestamp = [...words];
        wordsWithServerTimestamp[lastWordIndex] = {
          ...lastWord,
          timestamp: Date.now()
        };
        
        // Update the round words with server timestamp
        round.set("words", wordsWithServerTimestamp);
        console.log(`[HH SERVER TIMESTAMP] Player ${lastWord.player} added server timestamp to word "${lastWord.text}"`);
        
        // Use updated words for validation
        words = wordsWithServerTimestamp;
      }
    }
    
    // Turn validation - check for consecutive words from same player
    function validateHHTurns() {
      if (words.length >= 2) {
        const lastWord = words[words.length - 1];
        const secondLastWord = words[words.length - 2];
        
        if (lastWord.player === secondLastWord.player) {
          console.log(`[HH Validation] Player ${lastWord.player} consecutive words detected`);
          
          // Remove invalid word and fix turn
          const correctedWords = words.slice(0, -1);
          const players = round.currentGame.players;
          const otherPlayer = players.find(p => p.id !== lastWord.player);
          
          if (otherPlayer) {
            round.set("words", correctedWords);
            round.set("currentTurnPlayerId", otherPlayer.id);
            Empirica.flush();
            console.log(`[HH Validation] Corrected - turn to ${otherPlayer.id}`);
          }
        }
      }
    }
    
    validateHHTurns();
  }
  
});

