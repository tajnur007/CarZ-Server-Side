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

        // Database and Collections 
        const database = client.db('carz_zone');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');

        // Read Operations 
        app.get('/products', async (req, res) => {
            console.log('Hitting products...')
            const cursor = await productsCollection.find({}).toArray();
            // console.log(cursor);
            res.send(cursor);
        });

        // Add a User 
        app.post('/users', async (req, res) => {
            console.log('Hitting the post', req.body);
            const newUser = req.body;
            const result = await usersCollection.insertOne(newUser);
            console.log(result);
            res.json(result);
        });

        // Admin Checking 
        app.post('/isAdmin', async (req, res) => {
            console.log('Hitting the post', req.body);
            const query = { email: `${req.body.email}` };
            const result = await usersCollection.findOne(query);
            console.log(result);

            if (result?.role === 'admin') {
                res.json({ isAdmin: true });
            }
            else {

                res.json({ isAdmin: false });
            }
        })


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