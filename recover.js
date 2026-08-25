const fs = require('fs');

const path = 'C:\\Users\\USER\\.gemini\\antigravity-ide\\brain\\12221422-32ec-4289-b08f-f9022ea0f86c\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(path, 'utf8').split('\n');

let dbJs = null;
let serverJs = null;

for (const line of lines) {
  if (!line) continue;
  try {
    const data = JSON.parse(line);
    const content = JSON.stringify(data);
    if (content.includes('db.js') || content.includes('server.js')) {
      if (data.tool_calls) {
        for (const tc of data.tool_calls) {
          if (tc.name.includes('write_to_file')) {
            const args = tc.arguments;
            if (args.TargetFile && args.TargetFile.includes('db.js')) dbJs = args.CodeContent;
            if (args.TargetFile && args.TargetFile.includes('server.js')) serverJs = args.CodeContent;
          }
        }
      }
    }
  } catch(e) {}
}

if (dbJs) fs.writeFileSync('D:\\Knight Helix\\backend\\db.js', dbJs);
if (serverJs) fs.writeFileSync('D:\\Knight Helix\\backend\\server.js', serverJs);

console.log('Recovered db.js:', !!dbJs);
console.log('Recovered server.js:', !!serverJs);
