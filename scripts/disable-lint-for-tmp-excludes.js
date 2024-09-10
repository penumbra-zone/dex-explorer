import fs from 'fs';
import path from 'path';
import tmpExcludes from '../tmp-lint-excludes.js';

// Array of file paths to process
const filePaths = tmpExcludes.map(filepath => filepath);

// The ESLint comment to be added
const eslintComment =
  '// @ts-nocheck\n/* eslint-disable -- disabling this file as this was created before our strict rules */\n';

filePaths.forEach(filePath => {
  // Read the file
  fs.readFile(filePath, 'utf8', (err, data) => {
    console.log('TCL: err', err);
    console.log('TCL: data', data);
    // Check if the first line is already the ESLint comment
    const firstLine = data.split('\n')[0].trim();
    if (firstLine === eslintComment.trim()) {
      return;
    }

    // Prepend the ESLint comment
    const updatedData = eslintComment + data;

    // Write the updated file back to the filesystem
    fs.writeFile(filePath, updatedData, 'utf8', () => {
      // eslint-disable-next-line no-console -- log
      console.log(`ESLint comment added to ${filePath}`);
    });
  });
});
