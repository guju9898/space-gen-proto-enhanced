#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Files to check
const targetFiles = [
  'app/layout.tsx',
  'app/layout.ts', 
  'app/globals.css',
  'src/app/layout.tsx',
  'src/app/globals.css'
];

// Track files we've processed to avoid duplicates
const processedFiles = new Set();

// Function to detect and remove BOM and zero-width characters
function normalizeText(content) {
  let hadBOM = false;
  let zeroWidthsFound = 0;
  let convertedCRLF = false;
  
  // Remove UTF-8 BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
    hadBOM = true;
  }
  
  // Remove zero-width characters
  const zeroWidthChars = [
    '\uFEFF', // Zero Width No-Break Space (BOM)
    '\u200B', // Zero Width Space
    '\u200E', // Left-to-Right Mark
    '\u200F', // Right-to-Left Mark
    '\u2060', // Word Joiner
    '\u2061', // Function Application
    '\u2062', // Invisible Times
    '\u2063', // Invisible Separator
    '\u2064', // Invisible Plus
  ];
  
  for (const char of zeroWidthChars) {
    const before = content.length;
    content = content.replace(new RegExp(char, 'g'), '');
    const after = content.length;
    zeroWidthsFound += (before - after) / char.length;
  }
  
  // Convert CRLF to LF
  if (content.includes('\r\n')) {
    content = content.replace(/\r\n/g, '\n');
    convertedCRLF = true;
  }
  
  return { content, hadBOM, zeroWidthsFound, convertedCRLF };
}

// Function to find imported files from app/src directories
function findImportedFiles(filePath, content) {
  const imports = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  const appImports = imports
    .filter(imp => imp.startsWith('./') || imp.startsWith('../') || imp.startsWith('@/'))
    .map(imp => {
      if (imp.startsWith('@/')) {
        return imp.replace('@/', '');
      }
      if (imp.startsWith('./')) {
        return path.join(path.dirname(filePath), imp.slice(2));
      }
      if (imp.startsWith('../')) {
        return path.resolve(path.dirname(filePath), imp);
      }
      return imp;
    })
    .filter(imp => {
      const fullPath = path.resolve(projectRoot, imp);
      return fs.existsSync(fullPath) && 
             (fullPath.includes('/app/') || fullPath.includes('/src/app/')) &&
             (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css'));
    });
    
  return appImports;
}

// Function to process a single file
function processFile(filePath) {
  if (processedFiles.has(filePath)) {
    return null;
  }
  
  const fullPath = path.resolve(projectRoot, filePath);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  processedFiles.add(filePath);
  
  try {
    const originalContent = fs.readFileSync(fullPath, 'utf8');
    const { content, hadBOM, zeroWidthsFound, convertedCRLF } = normalizeText(originalContent);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
    }
    
    return {
      file: filePath,
      hadBOM,
      zeroWidthsFound,
      convertedCRLF,
      changed: content !== originalContent
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return {
      file: filePath,
      error: error.message
    };
  }
}

// Main execution
console.log('🔍 Scanning and normalizing files...\n');

const results = [];

// Process target files
for (const file of targetFiles) {
  const result = processFile(file);
  if (result) {
    results.push(result);
  }
}

// Find and process imported files
for (const result of results) {
  if (result.error) continue;
  
  const fullPath = path.resolve(projectRoot, result.file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const imports = findImportedFiles(result.file, content);
    
    for (const importPath of imports) {
      const importResult = processFile(importPath);
      if (importResult) {
        results.push(importResult);
      }
    }
  }
}

// Print report
console.log('📊 Normalization Report:');
console.log('========================\n');

let totalChanged = 0;
let totalBOM = 0;
let totalZeroWidth = 0;
let totalCRLF = 0;

for (const result of results) {
  if (result.error) {
    console.log(`❌ ${result.file}: ${result.error}`);
    continue;
  }
  
  const status = result.changed ? '✅' : '⚪';
  console.log(`${status} ${result.file}:`);
  console.log(`   BOM removed: ${result.hadBOM ? 'Yes' : 'No'}`);
  console.log(`   Zero-width chars: ${result.zeroWidthsFound}`);
  console.log(`   CRLF converted: ${result.convertedCRLF ? 'Yes' : 'No'}`);
  console.log(`   File changed: ${result.changed ? 'Yes' : 'No'}\n`);
  
  if (result.changed) totalChanged++;
  if (result.hadBOM) totalBOM++;
  if (result.zeroWidthsFound > 0) totalZeroWidth += result.zeroWidthsFound;
  if (result.convertedCRLF) totalCRLF++;
}

console.log('📈 Summary:');
console.log(`   Files processed: ${results.length}`);
console.log(`   Files changed: ${totalChanged}`);
console.log(`   BOMs removed: ${totalBOM}`);
console.log(`   Zero-width characters removed: ${totalZeroWidth}`);
console.log(`   CRLF conversions: ${totalCRLF}`);

if (totalChanged === 0) {
  console.log('\n🎉 All files are already normalized!');
} else {
  console.log(`\n✨ Normalized ${totalChanged} files successfully!`);
}



