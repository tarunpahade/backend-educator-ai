const { exec } = require("child_process");
const { writeFileSync } = require("fs");

// Function to execute a code file in different languages
const executeMultipleLanguages = (filepath, input, language) => {
  return new Promise((resolve, reject) => {
    let command;

    switch (language) {
      case "py":
        command = `python ${filepath}`;
        break;
      case "cpp":
        // Assume you have a compiled file
        command = `./${filepath}`;
        break;
      case "c":
        // Similar to C++
        command = `./${filepath}`;
        break;
      case "java":
        // Assume Java class name is extracted from filepath
        const className = extractClassName(filepath);
        command = `java ${className}`;
        break;
      // Add cases for other languages as needed
      default:
        reject(`Unsupported language: ${language}`);
        return;
    }

    const process = exec(command);

    if (input) {
      process.stdin.write(input);
      process.stdin.end();
    }

    let output = '';
    process.stdout.on('data', (data) => {
      output += data;
    });

    process.stderr.on('data', (data) => {
      reject(data);
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(`Process exited with code ${code}`);
      } else {
        resolve(output);
      }
    });
  });
};

const extractClassName = (filepath) => {
  // Implement logic to extract class name from the filepath for Java
  // This is necessary as Java requires class name for execution
};

module.exports = {
  executeMultipleLanguages,
};
