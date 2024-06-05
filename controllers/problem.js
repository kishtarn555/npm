const mongo = require('../mondodb');


async function getData(Id) {
    let res = undefined;
    const client = mongo.client();
    try {
        // Connect the client to the server
        await client.connect();
        console.log("Connected to MongoDB");

        // Get the database and collection
        const database = client.db("up");
        const collection = database.collection("problems");

        // Find the document based on the ID (assuming `id` is a column in MongoDB)
        let lid = parseInt(Id); // Attempt to parse Id to integer

        // If parsing fails, lid will be NaN, so fallback to Id
        if (isNaN(lid)) {
            lid = Id;
        }
        const query = { id: lid };
        // const projection = { title: 1, body: 1, _id: 0 }; // Include only title and body fields

        const result = await collection.findOne(query);

        if (result) {
            res = { title: result.Title, body: result.Body };
            console.log(`Found document with id ${Id}:`, res);
        } else {
            console.log(`Document with id ${Id} not found.`);
        }
    } catch (error) {
        console.error("Error retrieving document:", error);
    } finally {
        // Close the client connection
        await client.close();
    }
    return res;
}
module.exports = getData;