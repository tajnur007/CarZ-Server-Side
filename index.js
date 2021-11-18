const express = require('express');
const { MongoClient, ObjectID } = require('mongodb');
const cors = require('cors');
var admin = require("firebase-admin");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7007;

// Firebase Admin Initialization 
var serviceAccount = require('./carz-zone-69e6b-firebase-adminsdk-b4cob-02175f4c5a.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Middlewares
app.use(cors());
app.use(express.json());

// Connection URI 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hwr1u.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Token Verification 
const verifyToken = async (req, res, next) => {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const idToken = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(idToken);
            // console.log(decodedUser);
            req.decodedUserEmail = decodedUser.email;
        }
        catch {
            console.log('You are catched');
        }
    }
    next();
}


async function run() {
    try {
        // Database Connection Call 
        await client.connect();
        console.log('Database connected!');

        // Database and Collections 
        const database = client.db('carz_zone');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');

        // Read All Products 
        app.get('/products', async (req, res) => {
            // console.log('Hitting products...')
            const cursor = await productsCollection.find({}).toArray();
            // console.log(cursor);
            res.send(cursor);
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

        // Add a User 
        app.post('/users', async (req, res) => {
            console.log('Hitting the post', req.body);
            const query = { email: `${req.body.email}` };
            const result = await usersCollection.findOne(query);

            if (result === null) {
                const newUser = req.body;
                const insertResult = await usersCollection.insertOne(newUser);
                console.log(insertResult);
                res.json(insertResult);
            }
        });

        // Add a Product 
        app.post('/addProduct', verifyToken, async (req, res) => {
            const email = req.query?.email;
            const query = { email: `${email}` };
            const result = await usersCollection.findOne(query);
            console.log(result);

            if ((req.decodedUserEmail === email) && (result?.role === 'admin')) {
                // console.log('Hitting the post', req.body);
                const newProduct = req.body;
                const insertResult = await productsCollection.insertOne(newProduct);
                console.log(insertResult);
                res.json(insertResult);

            }
            else {
                req.status(401).json({ message: 'User not authorized' });
            }
        });

        // Update Product Status 
        app.delete('/updateProduct', verifyToken, async (req, res) => {
            const id = req.body?._id;
            const status = req.body?.status;
            const filter = { _id: ObjectID(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: `${status}`
                },
            };

            // Admin Checking 
            const email = req.query?.email;
            const query = { email: `${email}` };
            const result = await usersCollection.findOne(query);

            if ((req.decodedUserEmail === email) && (result?.role === 'admin')) {
                const updateResult = await productsCollection.updateOne(filter, updateDoc, options);
                console.log(updateResult);
                res.json(updateResult);
            }
            else {
                req.status(401).json({ message: 'User not authorized' });
            }
        });

        // Delete Product 
        app.put('/deleteProduct', verifyToken, async (req, res) => {
            const id = req.body?._id;
            const filter = { _id: ObjectID(id) };

            // Admin Checking 
            const email = req.query?.email;
            const query = { email: `${email}` };
            const result = await usersCollection.findOne(query);

            if ((req.decodedUserEmail === email) && (result?.role === 'admin')) {
                const deleteResult = await productsCollection.deleteOne(filter);
                console.log(deleteResult);
                res.json(deleteResult);
            }
            else {
                req.status(401).json({ message: 'User not authorized' });
            }
        });

        // Making Admin Process 
        app.put('/makeAdmin', verifyToken, async (req, res) => {
            const newAdminEmail = req.body?.email;
            const filter = { email: `${newAdminEmail}` };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            // Admin Checking 
            const email = req.query?.email;
            const query = { email: `${email}` };
            const result = await usersCollection.findOne(query);

            if ((req.decodedUserEmail === email) && (result?.role === 'admin')) {
                const updateResult = await usersCollection.updateOne(filter, updateDoc, options);
                console.log(updateResult);
                res.json(updateResult);
            }
            else {
                req.status(401).json({ message: 'User not authorized' });
            }
        });


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