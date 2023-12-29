const Queue = require("bull");
const { MongoClient,  ObjectId } = require('mongodb');

const { executeCpp } = require("./executeCpp");
const { executePy } = require("./executePy");
const { executeC } = require("./executeC");
const { executeJava } = require("./executeJava");
const { executeJs } = require("./executeJs");

const jobQueue = new Queue("job-runner-queue");
const NUM_WORKERS = 5;

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


jobQueue.process(NUM_WORKERS, async ({ data }) => {
  console.log('Data For Job');
  const jobId = data.id;
  run().catch(console.dir);
  const db = client.db("test");
  const Jobs = db.collection("Jobs");

  console.log(jobId, 'Job started Running');
run().catch(console.dir);

  const job = await Jobs.findOne({ _id: new ObjectId(jobId) });
  
console.log(job, 'Job Data');
  if (job === undefined) {
    throw Error(`cannot find Job with id ${jobId}`);
  }
  try {
    let output;
    job.startedAt = new Date();
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
    }else if (job.language === "js") { // Handling JavaScript
      console.log('Executing JavaScript function');
      output = await executeJs(job.filepath);
    } else {
    throw Error(`Language specified does not exists `);

    }
    
  console.log(output ,'no output is saved');
    job.completedAt = new Date();
    job.output = output;
    job.status = "success";
    await Jobs.updateOne({ _id: new ObjectId(jobId) }, { $set: job });
    
    return true;
  } catch (err) {
    job.completedAt = new Date();
    job.output = JSON.stringify(err);
    job.status = "error";
    await Jobs.updateOne({ _id: new ObjectId(jobId) }, { $set: job });
    throw Error(JSON.stringify(err));
  }
});

jobQueue.on("failed", (error) => {
  console.error(error.data.id, error.failedReason);
});

const addJobToQueue = async (jobId) => {

  try {
    await jobQueue.add({
      id: jobId,
    });
    console.log(`Job ${jobId} added to the queue`);
  } catch (error) {
    console.error(`Error adding job to the queue: ${error}`);
    throw error; // Or handle error appropriately
  }
};

module.exports = {
  addJobToQueue,
};
