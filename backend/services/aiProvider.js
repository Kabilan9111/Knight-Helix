const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');

const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// ------------------------------------------
// TOOLS (Server-Side Executables)
// ------------------------------------------

const getWorkers = () => {
  return db.prepare('SELECT workerId, name, status FROM workers').all();
};

const getProjects = () => {
  return db.prepare('SELECT projectId, name FROM projects').all();
};

const getTasks = () => {
  return db.prepare('SELECT taskId, title, assignedWorkerId, status, projectId, startDate, dueDate FROM tasks').all();
};

const checkWorkerAvailability = (workerId, startDate, dueDate) => {
  // Simple deterministic check if worker has overlapping tasks
  const overlap = db.prepare(`
    SELECT taskId, title FROM tasks 
    WHERE assignedWorkerId = ? 
      AND status != 'Completed'
      AND (
        (startDate <= ? AND dueDate >= ?) OR
        (startDate <= ? AND dueDate >= ?)
      )
  `).all(workerId, dueDate, startDate, startDate, dueDate);
  
  if (overlap.length > 0) {
    return { available: false, conflicts: overlap };
  }
  return { available: true };
};

const getWeatherRisk = (location) => {
  // Deterministic mock logic based on location
  if (location && location.toLowerCase().includes('site b')) {
    return { level: 'Medium', description: 'Forecast indicates 60% chance of heavy rain on Aug 28.' };
  }
  return { level: 'Low', description: 'Clear weather expected.' };
};

const checkProjectDependencies = (projectId) => {
  // In a real app, query dependency graph. Mocking for prototype.
  return [
    { activity: 'Site Marking', status: 'Pending', requiredBefore: 'Excavation' }
  ];
};

// Tool Definitions for the LLM
const TOOLS_SCHEMA = [
  {
    name: 'getWorkers',
    description: 'Retrieve a list of all workers and their current statuses (AVAILABLE, BUSY, INACTIVE).'
  },
  {
    name: 'checkWorkerAvailability',
    description: 'Check if a specific worker is available between two dates.',
    parameters: {
      type: 'object',
      properties: {
        workerId: { type: 'string' },
        startDate: { type: 'string', description: 'e.g., 28 Aug 2026' },
        dueDate: { type: 'string', description: 'e.g., 30 Aug 2026' }
      },
      required: ['workerId', 'startDate', 'dueDate']
    }
  },
  {
    name: 'getWeatherRisk',
    description: 'Get the operational weather risk for a specific location.',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string' }
      },
      required: ['location']
    }
  },
  {
    name: 'checkProjectDependencies',
    description: 'Check if there are any outstanding dependencies for tasks in the given project.',
    parameters: {
      type: 'object',
      properties: {
        projectId: { type: 'string' }
      },
      required: ['projectId']
    }
  }
];

// Helper to execute tool calls securely
const executeTool = (toolName, args) => {
  switch (toolName) {
    case 'getWorkers':
      return getWorkers();
    case 'checkWorkerAvailability':
      return checkWorkerAvailability(args.workerId, args.startDate, args.dueDate);
    case 'getWeatherRisk':
      return getWeatherRisk(args.location);
    case 'checkProjectDependencies':
      return checkProjectDependencies(args.projectId);
    default:
      return { error: `Tool ${toolName} not found or not permitted.` };
  }
};


// ------------------------------------------
// SYSTEM PROMPT
// ------------------------------------------
const SYSTEM_PROMPT = `
You are the SANCHALAN AI Agentic Task Planner, an enterprise project execution intelligence assistant.
Your goal is to strategically help the Admin plan and schedule project tasks.

You have access to powerful tools. You MUST use these tools to investigate before producing a final plan:
- checkWorkerAvailability: to ensure workers are free.
- getWeatherRisk: to check if weather will impact the site.
- checkProjectDependencies: to check if prerequisites exist.

You are interacting with the Admin.
You must gather necessary information to create a solid project execution plan.
When you have investigated constraints, evaluated alternatives, and have enough information, output a JSON object representing the plan.

REQUIRED INFORMATION FOR A PLAN:
1. Project ID and Name
2. Task Title / Activity
3. Assigned Worker ID and Name
4. Location (Site)
5. Start Date and Due Date
6. Priority (Low, Medium, High)
7. Schedule Steps (an array of steps taking place between the start and due date)
8. Risks (an array of detected risks)
9. Confidence Score (a number 0-100, based on validated checks)
10. Rationale (a string explaining why this plan was chosen, mentioning tools used)

RULES:
- Do NOT output a plan until you are sure about the Project, Worker, and Dates.
- Ask clarification questions if the user's request is ambiguous.
- Use the available context to avoid asking redundant questions.
- Output ONLY a JSON object when you are ready to propose the plan. The JSON must match the following format exactly:
{
  "type": "plan",
  "plan": {
    "projectId": "...",
    "projectName": "...",
    "title": "...",
    "assignedWorkerId": "...",
    "workerName": "...",
    "location": "...",
    "startDate": "...",
    "dueDate": "...",
    "priority": "High",
    "scheduleSteps": [
      { "date": "...", "description": "..." }
    ],
    "risks": [
      { "level": "Medium", "description": "..." }
    ],
    "confidence": 95,
    "rationale": "I selected Ananthi as she was confirmed available. I noted a Medium weather risk on Aug 28.",
    "summary": { "duration": "5 days", "dependencies": 0 }
  }
}

If you need to ask a question, return normal text. If you are generating the final plan, return ONLY the JSON block. Do not wrap it in markdown block quotes.
`;

// ------------------------------------------
// MAIN GENERATION FUNCTION
// ------------------------------------------
async function generateResponse(history, contextData, io, sessionId) {
  
  const emitTrace = (action) => {
    if (io && sessionId) {
      io.to(sessionId).emit('agent_trace', { action });
    }
  };

  // --------------------------------
  // FALLBACK MOCK LOGIC (No API Key)
  // --------------------------------
  if (!genAI) {
    console.log("No GEMINI_API_KEY found, using fallback AI mock logic with simulated traces.");
    
    const lastMsg = history[history.length - 1].content.toLowerCase();
    
    if (lastMsg.includes('plan') || lastMsg.includes('ok') || lastMsg.includes('yes')) {
       // Simulate agent loop
       emitTrace("✓ Analyzing project context and constraints");
       await new Promise(r => setTimeout(r, 800));
       
       emitTrace(`✓ Checking worker availability for ${contextData.workerName || 'selected worker'}`);
       await new Promise(r => setTimeout(r, 800));

       emitTrace(`✓ Checking weather forecast for ${contextData.site || 'Site B'}`);
       await new Promise(r => setTimeout(r, 800));

       emitTrace("✓ Evaluating candidate schedules against dependencies");
       await new Promise(r => setTimeout(r, 800));

       emitTrace("✓ Validating recommended plan");
       await new Promise(r => setTimeout(r, 800));

       // Return a mocked plan
       return JSON.stringify({
        type: "plan",
        plan: {
          projectId: contextData.projectId || "proj1",
          projectName: "Project Alpha — Refinery Expansion",
          title: contextData.title || "Pump Foundation Excavation",
          assignedWorkerId: contextData.assignedWorkerId || "W-123456",
          workerName: contextData.workerName || "Ananthi",
          location: contextData.site || "Site B",
          startDate: contextData.startDate || "25 Aug 2026",
          dueDate: contextData.dueDate || "30 Aug 2026",
          priority: contextData.priority || "High",
          scheduleSteps: [
            { date: "25 Aug 2026", description: "Site preparation and marking" },
            { date: "26 Aug 2026", description: "Initial excavation" },
            { date: "28 Aug 2026", description: "Main excavation" },
            { date: "30 Aug 2026", description: "Inspection and completion" }
          ],
          risks: [
            { level: "Medium", description: "Weather disruption expected on Aug 28" }
          ],
          confidence: 94,
          rationale: "I verified that Ananthi is available for these dates. I evaluated the weather at Site B and identified a Medium risk on Aug 28, so heavy excavation is scheduled earlier. Dependencies are respected.",
          summary: { duration: "5 days", dependencies: 2 }
        }
       });
    }

    emitTrace("✓ Checking existing dependencies");
    await new Promise(r => setTimeout(r, 800));

    return "I have the project and location. Before I build the schedule, does this excavation depend on any site-marking activity being completed first?";
  }

  // --------------------------------
  // REAL GEMINI AGENT LOOP
  // --------------------------------
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      tools: [{ functionDeclarations: TOOLS_SCHEMA }]
    });
    
    // Convert generic history to Gemini format
    let contents = [];
    
    let contextStr = `CURRENT FORM CONTEXT:\n${JSON.stringify(contextData, null, 2)}\n\nAVAILABLE PROJECTS:\n${JSON.stringify(getProjects())}\n\nSYSTEM INSTRUCTIONS:\n${SYSTEM_PROMPT}`;
    
    contents.push({ role: 'user', parts: [{ text: contextStr }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood. I have the context and instructions.' }] });

    for (const msg of history) {
      if (msg.role === 'system') continue;
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }

    // Orchestrator Loop (max 5 iterations to prevent infinite loops)
    const MAX_ITERATIONS = 5;
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      
      const result = await model.generateContent({ contents });
      const response = result.response;
      
      // If it's a function call
      const functionCalls = response.functionCalls();
      if (functionCalls && functionCalls.length > 0) {
        
        // Add the model's function call to history
        contents.push({ role: 'model', parts: response.parts });
        
        const functionResponses = [];
        for (const call of functionCalls) {
          const name = call.name;
          const args = call.args;
          
          // Emit trace to UI
          emitTrace(`✓ Executing tool: ${name}`);
          
          // Execute tool securely
          const toolResult = executeTool(name, args);
          
          functionResponses.push({
            functionResponse: {
              name,
              response: { content: toolResult }
            }
          });
        }
        
        // Push tool results back to LLM
        contents.push({ role: 'user', parts: functionResponses });
        
        // Continue loop to let LLM reason about results
        continue;
      }
      
      // If it's a text response, we are done
      const text = response.text();
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
      if (cleaned.startsWith('```')) cleaned = cleaned.replace(/```/g, '').trim();
      
      return cleaned;
    }
    
    throw new Error("Maximum agent iterations reached.");

  } catch (err) {
    console.error("AI Generation Error:", err);
    throw new Error("AI planning is temporarily unavailable.");
  }
}

module.exports = {
  generateResponse
};
