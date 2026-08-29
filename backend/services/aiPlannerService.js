const { StateGraph, END } = require('@langchain/langgraph');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');
const { validateSchedule } = require('./scheduleValidator');
const { generateExecutionSchedule } = require('./schedulingEngine');
const db = require('../db');

/**
 * AI Planner Service using LangGraph
 */

const planStateChannels = {
  sessionId: { value: (a, b) => b || a, default: () => null },
  projectId: { value: (a, b) => b || a, default: () => null },
  userRequest: { value: (a, b) => b || a, default: () => null },
  contextData: { value: (a, b) => b || a, default: () => null },
  extractedConstraints: {
    value: (a, b) => ({ ...a, ...b }),
    default: () => ({})
  },
  missingInformation: { value: (a, b) => b || a, default: () => [] },
  currentQuestion: { value: (a, b) => b, default: () => null }, // Replaced completely on set
  userAnswers: {
    value: (a, b) => [...a, ...(b || [])],
    default: () => []
  },
  candidatePlan: { value: (a, b) => b || a, default: () => null },
  validationResults: { value: (a, b) => b || a, default: () => null },
  iterationCount: { value: (a, b) => a + b, default: () => 0 }
};

const MAX_PLANNING_ITERATIONS = 5;

let llm;
if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
  llm = new ChatGoogleGenerativeAI({
    model: 'gemini-1.5-pro',
    temperature: 0.1
  });
} else {
  console.log("No GEMINI_API_KEY found, using local AI mock logic for LangGraph.");
  llm = {
    invoke: async (messages) => {
      const prompt = messages[1]?.content || "";
      if (prompt.includes("Identify missing information")) {
        return { content: JSON.stringify({ complete: true }) };
      }
      if (prompt.includes("Generate the strategic sequence")) {
        const sysMsg = messages[0]?.content || "";
        let startDate = new Date();
        let endDate = new Date();
        let assignedWorkerId = "W-123456";
        try {
           const match = sysMsg.match(/Hard Constraints: ({.*})/);
           if (match && match[1]) {
             const constraints = JSON.parse(match[1]);
             if (constraints.startDate) startDate = new Date(constraints.startDate);
             if (constraints.endDate) endDate = new Date(constraints.endDate);
           }
           const ctxMatch = sysMsg.match(/Available Context: ({.*})/);
           if (ctxMatch && ctxMatch[1]) {
             const ctx = JSON.parse(ctxMatch[1]);
             if (ctx.assignedWorkerId) assignedWorkerId = ctx.assignedWorkerId;
           }
        } catch(e) {}
        
        const strategySequence = [];
        let currentDate = new Date(startDate);
        let idCounter = 1;
        
        const titles = ["Site Preparation", "Initial Excavation", "Material Transport", "Foundation Work", "Structural Assembly", "Quality Check", "Cleanup & Handover"];
        
        while (currentDate <= endDate && idCounter <= 30) {
          if (currentDate.getDay() !== 0) { // Skip Sundays
             const id = `MOCK-${idCounter}`;
             const prevId = idCounter > 1 ? [`MOCK-${idCounter - 1}`] : [];
             const titleIndex = (idCounter - 1) % titles.length;
             strategySequence.push({
               id,
               title: titles[titleIndex],
               duration: 1,
               assignedWorkerId,
               dependencies: prevId
             });
             idCounter++;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }

        if (strategySequence.length === 0) {
           strategySequence.push({ id: "MOCK-1", title: "Execution", duration: 1, assignedWorkerId });
        }

        return { content: JSON.stringify({
          strategySequence,
          reasoning: "Generated date-by-date schedule using deterministic offline mock logic spanning the entire selected execution window."
        })};
      }
      return { content: "{}" };
    }
  };
}

/**
 * NODE: Understand Request
 * Parses the initial request and extracts known constraints.
 */
async function understandRequestNode(state) {
  const { userRequest, extractedConstraints } = state;
  if (!userRequest) return {};

  const sysMsg = new SystemMessage(`
You are a project planning AI. Extract any additional hard constraints from the user request (other than the execution window which is already locked).
Output ONLY JSON. Example:
{
  "targetTask": "Task Name",
  "targetWorker": "Worker Name",
  "priority": "HIGH"
}
If no additional constraints are mentioned, output {}.
  `);

  const response = await llm.invoke([sysMsg, new HumanMessage(userRequest)]);
  let newConstraints = { ...extractedConstraints };
  try {
    const rawText = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(rawText);
    // Merge while preserving the strict execution window dates
    newConstraints = {
      ...newConstraints,
      ...parsed,
      startDate: extractedConstraints.startDate, 
      endDate: extractedConstraints.endDate
    };
  } catch (e) {}

  return {
    extractedConstraints: newConstraints
  };
}

/**
 * NODE: Retrieve Context
 */
async function retrieveContextNode(state) {
  const { projectId } = state;
  const project = db.prepare('SELECT * FROM projects WHERE projectId = ?').get(projectId);
  const tasks = db.prepare('SELECT * FROM tasks WHERE projectId = ?').all(projectId);
  const workers = db.prepare('SELECT * FROM workers').all();
  
  return {
    contextData: { project, existingTasks: tasks, workers }
  };
}

/**
 * NODE: Identify Missing Information
 */
async function identifyMissingInfoNode(state) {
  const { extractedConstraints, userAnswers, contextData } = state;
  
  const sysMsg = new SystemMessage(`
You are a strategic AI planner. Evaluate what critical information is missing to generate a schedule.
Constraints already extracted: ${JSON.stringify(extractedConstraints)}
User Answers so far: ${JSON.stringify(userAnswers)}

If no critical information is missing, return {"complete": true}.
If information is missing, generate ONE structured multiple-choice question.

Output ONLY JSON in this format:
{
  "complete": false,
  "question": {
    "questionId": "string",
    "question": "The question text",
    "type": "single_choice",
    "options": [
      { "id": "opt1", "label": "Option 1" },
      { "id": "other", "label": "Other / Custom", "requiresInput": true }
    ]
  }
}
Do not ask for information already present in constraints or user answers.
  `);

  const response = await llm.invoke([sysMsg, new HumanMessage("Identify missing information.")]);
  
  try {
    const rawText = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(rawText);
    
    if (result.complete) {
      return { currentQuestion: null }; // Clears question
    } else {
      return { currentQuestion: result.question };
    }
  } catch (e) {
    return { currentQuestion: null }; // Fail safe to continue
  }
}

/**
 * NODE: Ask Question
 * This is a dummy node that signifies the graph should pause. 
 * LangGraph uses Interrupts for this natively, but for simplicity we will just return END if a question exists,
 * and the caller handles it.
 */
function askQuestionNode(state) {
  // We don't actually do anything here, the edge will route to END
  return {};
}

/**
 * NODE: Strategic Planning
 * Determines task order, durations (if missing), and assigns resources.
 * DOES NOT GENERATE EXACT DATES.
 */
async function strategicPlanningNode(state) {
  const { contextData, extractedConstraints, userAnswers, validationResults } = state;

  const sysMsg = new SystemMessage(`
You are the SANCHALAN Strategic AI Orchestrator.
Your goal is to define the strategy: select which tasks to run, in what logical order, their dependencies, and assigned workers.
DO NOT CALCULATE DATES. ONLY determine duration (in days) and logical sequence.
The deterministic scheduler will handle dates based on constraints.

Available Context: ${JSON.stringify(contextData)}
Hard Constraints: ${JSON.stringify(extractedConstraints)}
User Preferences: ${JSON.stringify(userAnswers)}

Output ONLY JSON:
{
  "strategySequence": [
    {
      "id": "taskId",
      "title": "Task title",
      "duration": 2,
      "assignedWorkerId": "workerId",
      "dependencies": ["predecessorTaskId"]
    }
  ],
  "reasoning": "Explain the strategy chosen"
}
  `);

  let prompt = "Generate the strategic sequence.";
  if (validationResults && (!validationResults.valid)) {
    prompt += `\nPREVIOUS STRATEGY FAILED VALIDATION! Fix these issues: ${JSON.stringify(validationResults.violations)} ${JSON.stringify(validationResults.conflicts)}`;
  }

  const response = await llm.invoke([sysMsg, new HumanMessage(prompt)]);

  let strategy;
  try {
    const rawText = response.content.replace(/```json/g, '').replace(/```/g, '').trim();
    strategy = JSON.parse(rawText);
  } catch (err) {
    return { candidatePlan: { planningStatus: "FAILED", reasoning: "JSON Parsing Error" }, iterationCount: 1 };
  }

  return {
    candidatePlan: {
      planningStatus: "STRATEGY_GENERATED",
      strategySequence: strategy.strategySequence,
      reasoning: strategy.reasoning
    },
    iterationCount: 1
  };
}

/**
 * NODE: Schedule Generation
 * Calls the deterministic engine.
 */
async function scheduleGenerationNode(state) {
  const { candidatePlan, extractedConstraints } = state;
  
  if (candidatePlan.planningStatus === "FAILED") return {};

  try {
    const scheduleResult = generateExecutionSchedule({
      activities: candidatePlan.strategySequence,
      startDate: extractedConstraints.startDate,
      endDate: extractedConstraints.endDate,
      constraints: extractedConstraints
    });

    candidatePlan.activities = scheduleResult.activities;
    candidatePlan.planningStatus = scheduleResult.valid ? "SCHEDULED" : "SCHEDULE_CONFLICT";
    
    return { candidatePlan, validationResults: { valid: scheduleResult.valid, conflicts: scheduleResult.conflicts, violations: [] } };
  } catch (err) {
    return { validationResults: { valid: false, violations: [err.message], conflicts: [] } };
  }
}

/**
 * NODE: Validate Plan
 */
async function validatePlanNode(state) {
  const { candidatePlan, extractedConstraints } = state;
  if (!candidatePlan.activities) return {};

  const results = validateSchedule(candidatePlan, extractedConstraints);
  
  if (results.valid) {
    candidatePlan.planningStatus = "VALIDATED";
  } else {
    candidatePlan.planningStatus = "FAILED_VALIDATION";
  }

  return { validationResults: results, candidatePlan };
}

/**
 * Edge logic after identifying missing info.
 */
function routeAfterMissingInfo(state) {
  if (state.currentQuestion) {
    return 'askQuestion'; // Leads to END
  }
  return 'strategicPlanning';
}

function routeAfterValidation(state) {
  const { validationResults, iterationCount } = state;
  if (validationResults && validationResults.valid) {
    return END;
  }
  if (iterationCount >= MAX_PLANNING_ITERATIONS) {
    return END;
  }
  return 'strategicPlanning';
}

/**
 * Construct the graph
 */
function createPlannerGraph() {
  const workflow = new StateGraph({ channels: planStateChannels })
    .addNode('understandRequest', understandRequestNode)
    .addNode('retrieveContext', retrieveContextNode)
    .addNode('identifyMissingInfo', identifyMissingInfoNode)
    .addNode('askQuestion', askQuestionNode)
    .addNode('strategicPlanning', strategicPlanningNode)
    .addNode('scheduleGeneration', scheduleGenerationNode)
    .addNode('validatePlan', validatePlanNode)

    // Flow
    .addEdge('__start__', 'understandRequest') // START is typically '__start__' if START constant is missing
    .addEdge('understandRequest', 'retrieveContext')
    .addEdge('retrieveContext', 'identifyMissingInfo')
    
    // Branch on missing info
    .addConditionalEdges('identifyMissingInfo', routeAfterMissingInfo, {
      askQuestion: 'askQuestion',
      strategicPlanning: 'strategicPlanning'
    })
    
    // Pause execution if asking a question
    .addEdge('askQuestion', END)

    // Planning Loop
    .addEdge('strategicPlanning', 'scheduleGeneration')
    .addEdge('scheduleGeneration', 'validatePlan')
    
    .addConditionalEdges('validatePlan', routeAfterValidation, {
      strategicPlanning: 'strategicPlanning',
      [END]: END
    });

  return workflow.compile();
}

const plannerApp = createPlannerGraph();

/**
 * Public method to process a turn
 */
async function processPlannerTurn(initialState) {
  const finalState = await plannerApp.invoke(initialState);
  return finalState;
}

module.exports = {
  processPlannerTurn,
  planStateChannels
};
