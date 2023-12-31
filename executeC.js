const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "outputs");

if (!fs.existsSync(outputPath)) {
  fs.mkdirSync(outputPath, { recursive: true });
}
const executeC = (filepath) => {
    
  console.log('HII',filepath);
  const jobId = path.basename(filepath).split(".")[0];
  const outPath = path.join(outputPath, `${jobId}.out`);
console.log('wE Will Havee Error Below');
  return new Promise((resolve, reject) => {
    exec(
     `gcc ${filepath} -o ${outPath} && cd ${outputPath} && ./${jobId}.out`,
    (error, stdout, stderr) => {
        error && reject({ error, stderr });
        stderr && reject(stderr);
        resolve(stdout);
      }
    );
  });
};

module.exports = {
  executeC,
};
