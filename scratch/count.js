const fs = require('fs');
const content = fs.readFileSync('constants/tod-questions.ts', 'utf-8');
const truthsMatch = content.match(/const truths = \[\s*([\s\S]*?)\s*\];/);
const actionsMatch = content.match(/const actions = \[\s*([\s\S]*?)\s*\];/);
const truths = truthsMatch ? truthsMatch[1].split('\n').filter(l => l.trim().startsWith('"')).length : 0;
const actions = actionsMatch ? actionsMatch[1].split('\n').filter(l => l.trim().startsWith('"')).length : 0;
console.log('Exact count -> Truths:', truths, '| Actions:', actions, '| Total:', truths + actions);
