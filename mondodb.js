const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');

const secret = fs.readFileSync('mongo.secret', 'utf-8').split('\n');
const user = secret[0].trim();
const password = secret[1].trim();
console.log(user)
console.log(password)

const uri = `mongodb+srv://${user}:${password}@cluster0.hefkqfc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    // strict: true,
    // deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("up").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

module.exports = {
    client:client,
    run: run
};
