const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7007;

// Middlewares
app.use(cors());
app.use(express.json());

// Connection URI 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hwr1u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        // Database Connection Call 
        await client.connect();
        console.log('Database connected!');

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir)

// Get Testing 
app.get('/', (req, res) => {
    res.send('CarZ Server Running....');
});

// Port Listening 
app.listen(port, () => {
    console.log('Server running on port:', port);
});