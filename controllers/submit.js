const mongo = require('../mondodb');

function getCurrentTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
  
  // Function to get a random status
  function getRandomStatus() {
    const statuses = ["RTE", "TLE", "WA", "AC", "CE", "PA"];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
  
  // Function to generate a random alphanumerical sequence of length 8
  function getRandomHashcode(length = 8) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

async function sendData(body) {
    res = undefined
    const client = mongo.client()
    try {
        // Connect the client to the server
        await client.connect();
        console.log("Connected to MongoDB");
    
        // Define the document to be inserted
        const doc = { language: body.language, problem: body.problemNumber,timestamp:getCurrentTimestamp(), hash:getRandomHashcode(), status:getRandomStatus()  };
        // Get the database and collection
        const database = client.db("up");
        const collection = database.collection("submissions");
        
        // Insert the document
        const result = await collection.insertOne(doc);
        console.log(`New document inserted with _id: ${result.insertedId}`);
        res= doc
      } catch (error) {
        console.error("Error inserting document: ", error);
      } finally {
        // Close the client connection
        await client.close();
      }
      return res
}

module.exports = sendData;