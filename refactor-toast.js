const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'marketplace-view.tsx',
  'tickets-view.tsx',
  'community-view.tsx',
  'events-view.tsx',
  'lost-found-view.tsx',
  'staff-tickets-view.tsx',
  'admin-community-view.tsx',
  'settings-view.tsx'
];

for (const file of filesToUpdate) {
  const filePath = path.join('c:\\Users\\bilal\\Desktop\\FAST University Files\\Database Systems\\Project\\Application\\hostel-hub\\components\\dashboard', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add Props interface and inject it into the function signature
  const funcRegex = /export function ([a-zA-Z]+View)\s*\(\)\s*\{/;
  content = content.replace(funcRegex, "interface Props { onToast: (msg: string, type: 'success' | 'error' | 'info') => void }\n\nexport function $1({ onToast }: Props) {");

  // 2. Remove the toast state
  const stateMultilineRegex = /const\s+\[toast,\s*setToast\][\s\S]*?\(null\);?\n?/;
  content = content.replace(stateMultilineRegex, '');

  // 3. Remove the pushToast function
  const pushToastRegex = /const\s+pushToast\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?setTimeout\([^)]*\)[^}]*\}\s*};?\n?/;
  // The pushToast block usually looks like:
  // const pushToast = (message: string, type: 'success' | 'error') => {
  //   setToast({ message, type })
  //   setTimeout(() => setToast(null), 3000)
  // }
  const regex3 = /const\s+pushToast\s*=\s*\([^)]*\)\s*=>\s*\{[\s\S]*?setTimeout[^}]*\};?\n?/;
  content = content.replace(regex3, '');

  // 4. Replace all occurrences of pushToast with onToast
  content = content.replace(/pushToast\(/g, 'onToast(');

  // 5. Remove the {toast && ... } JSX block.
  const jsxRegex = /\{toast\s*&&\s*\([\s\S]*?<\/div>\s*\)\}\n?/;
  content = content.replace(jsxRegex, '');

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
