const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient,  ObjectId } = require('mongodb');

const { generateFile } = require("./generateFile");

const { executeCpp } = require("./executeCpp");
const { executePy } = require("./executePy");
const { executeC } = require("./executeC");
const { executeJava } = require("./executeJava");
const { addJobToQueue } = require("./jobQueue"); 
const { executeJs } = require("./executeJs");
const { executeMultipleLanguages } = require("./executeMultipleLanguages.JS");

// mongoose.connect('mongodb+srv://tarunpahade:test123@cluster0.byx71hn.mongodb.net/?retryWrites=true&w=majority').then(()=>{
//   console.log('connected');
// });
require('dotenv').config();


const uri=process.env.MONGODB_URL
const client = new MongoClient(uri, {
    connectTimeoutMS: 30000, 
    useNewUrlParser: true, 
    useUnifiedTopology: true,
  });

  

  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      // // Send a ping to confirm a successful connection
      // await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close();
    }
  }
  




const app = express(); 

app.use(bodyParser.json({ limit: "50mb" }));
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "50mb",
  })
);
app.use(cors())


///for normal execution
app.post("/run", async (req, res) => {
  const { language , code, input } = req.body;

  console.log(language, "Length:", code);


  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filepath = await generateFile(language, code);
  const job = { language, filepath }
  
  let output;
  job.startedAt = new Date();

     executeMultipleLanguages
  
  try {
    
    output = await executeMultipleLanguages(filepath, input, language);
  
    // if (job.language === "cpp") {
    //   console.log('Err Executing function');
    //   output = await executeCpp(job.filepath);
    //   console.log(output,'this is output file');
    // } else if (job.language === "py") {
    //   output = await executePy(job.filepath);
    // } else if (job.language === "c") {
    //   output = await executeC(job.filepath);
    // } else if (job.language === "java") {
    //   output = await executeJava(job.filepath);
    // } else if (job.language === "js") { // Handling JavaScript
    //   console.log('Executing JavaScript function');
    //   output = await executeJs(job.filepath);
    // } else {
    // throw Error(`Language specified does not exists `);
    // }
    job.completedAt = new Date();
    job.output = output;
    job.status = "success";
   
    return res.status(201).json({ job:job });
  } catch (err) {
    job.completedAt = new Date();
    job.output = JSON.stringify(err);
    job.status = "error";
  
 return res.status(201).json({job:job})
  }


});

//normal execution along with database integration and polling , support for multiple concurrent requests
app.post("/runWithDB", async (req, res) => {
  const { language , code } = req.body;

  console.log(language, "Length:", code);
  run().catch(console.dir);
  const db = client.db("test");
  const Job = db.collection("Jobs");

  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filepath = await generateFile(language, code);
  // write into DB
  const job = (await Job.insertOne({ language, filepath })).insertedId
  
  const jobId = job["_id"];
console.log('file generated');
  let output;
  job["startedAt"] = new Date();
  
  
  try {
    if (job.language === "cpp") {
      console.log('Err Executing function');
      output = await executeCpp(job.filepath);
      console.log(output,'this is output file');
    } else if (job.language === "py") {
      output = await executePy(job.filepath);
    } else if (job.language === "c") {
      output = await executeC(job.filepath);
    } else if (job.language === "java") {
      output = await executeJava(job.filepath);
    } 
    job.completedAt = new Date();
    job.output = output;
    job.status = "success";
    await Job.updateOne({ _id: new ObjectId(jobId) }, { $set: job });
    
    return res.status(201).json({ jobId, success: true });
  } catch (err) {
    job.completedAt = new Date();
    job.output = JSON.stringify(err);
    job.status = "error";
    await Job.updateOne({ _id: new ObjectId(jobId) }, { $set: job });
     return res.status(201).json({job:job})
  }
 


});

//multiple concurrent requests , support for multiple concurrent requests
app.post("/runWithBull", async (req, res) => {

const { language = "cpp", code } = req.body;



if (code === undefined) {
  return res.status(400).json({ success: false, error: "Empty code body!" });
}
console.log(language, "Length:", code.length);
run().catch(console.dir);
  const db = client.db("test");
  const Job = db.collection("Jobs");

// need to generate a c++ file with content from the request
const filepath = await generateFile(language, code);
// write into DB
const jobId = (await Job.insertOne({ language, filepath })).insertedId

addJobToQueue(jobId);
res.status(201).json({ jobId });
app.get("/status", async (req, res) => {
  const jobId = req.query.id;

  if (jobId === undefined) {
    return res
      .status(400)
      .json({ success: false, error: "missing id query param" });
  }

  const job = await Job.findById(jobId);

  if (job === undefined) {
    return res.status(400).json({ success: false, error: "couldn't find job" });
  }

  return res.status(200).json({ success: true, job });
});
});


app.post("/runWithBull", async (req, res) => {

  run().catch(console.dir);
  const db = client.db("test");
  const Job = db.collection("Jobs");
const { language = "cpp", code } = req.body;

console.log(language, "Length:", code.length);

if (code === undefined) {
  return res.status(400).json({ success: false, error: "Empty code body!" });
}
// need to generate a c++ file with content from the request
const filepath = await generateFile(language, code);
// write into DB
const jobId = (await Job.insertOne({ language, filepath })).insertedId
console.log(jobId);
addJobToQueue(jobId);
res.status(201).json({ jobId });

});

app.post("/runTests", async (req, res) => {

  const { language , code, nums , targets , answers , fn } = req.body;
  
run().catch(console.dir);
const db = client.db("test");
const Job = db.collection("Jobs");
  
  console.log(language, "Length:", code.length);
  
  if (code === undefined) {
    return res.status(400).json({ success: false, error: "Empty code body!" });
  }
  // need to generate a c++ file with content from the request
  const filepath = await generateFile(language, code);
  // write into DB
const jobId = (await Job.insertOne({ language, filepath })).insertedId
  
  
  for (let i = 0; i < nums.length; i++) {
  
    const result = fn(nums[i], targets[i]);
    console.log(result,'this is result for ' + targets[i] + nums[i])
    assert.deepStrictEqual(result, answers[i]);
    addJobToQueue(jobId);
  }
  res.status(201).json({ jobId });
  
  });
  

app.get("/status", async (req, res) => {
  const jobId = req.query.id;

  run().catch(console.dir);
  const db = client.db("test");
  const Job = db.collection("Jobs");
    
  if (jobId === undefined) {
    return res
      .status(400)
      .json({ success: false, error: "missing id query param" });
  }
  

  const job = await Job.findOne({ _id: new ObjectId(jobId) });

  if (job === undefined) {
    return res.status(400).json({ success: false, error: "couldn't find job" });
  }

  return res.status(200).json({ success: true, job });
});

app.listen(3000, () => {
  console.log(`Listening on port 5000!`);
});
