const { MongoClient, ObjectId, Timestamp } = require("mongodb");


 
const uri=process.env.MONGODB_URL
const client = new MongoClient(uri, {
  connectTimeoutMS: 30000, 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
});
 
 const db = client.db("test");
  const Jobs = db.collection("Jobs");
 
 
const JobSchema = mongoose.Schema({
  language: {
    type: String,
    required: true,
    enum: ["c","cpp", "py","js"],
  },
  filepath: {
    type: String,
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "success", "error"],
  },
  output: {
    type: String,
  },
});
// default export
module.exports ={ Jobs }

