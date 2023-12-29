const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}

const executeJava = (filepath) => {
  const jobId = path.basename(filepath, '.java'); // Remove .java extension to get the class name
  const classPath = path.join(outputPath, jobId);

  return new Promise((resolve, reject) => {
    // Compile the Java file
    exec(`javac ${filepath} -d ${outputPath}`, (compileError, compileStdout, compileStderr) => {
      if (compileError) {
        return reject({ error: compileError, stderr: compileStderr });
      }

      // Execute the compiled Java class
      exec(`java -cp ${outputPath} ${jobId}`, (runError, runStdout, runStderr) => {
        if (runError) {
          return reject({ error: runError, stderr: runStderr });
        }

        resolve(runStdout);
      });
    });
  });
};

module.exports = {
  executeJava,
};
