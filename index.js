const express = require('express');
const { MongoClient, ObjectID } = require('mongodb');
const cors = require('cors');
var admin = require("firebase-admin");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 7007;

// Firebase Admin Initialization 
var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

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
        const ordersCollection = database.collection('orders');
        const usersCollection = database.collection('users');
        const reviewsCollection = database.collection('reviews');

        // Get All Products 
        app.get('/products', async (req, res) => {
            // console.log('Hitting products...')
            const cursor = await productsCollection.find({}).toArray();
            // console.log(cursor);
            res.send(cursor);
        });

        // Get Single Product 
        app.get('/products/:id', async (req, res) => {
            // console.log('Hitting products...')
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const result = await productsCollection.findOne(query);
            // console.log(cursor);
            res.send(result);
        });

        // Get All Reviews 
        app.get('/reviews', async (req, res) => {
            // console.log('Hitting products...')
            const cursor = await reviewsCollection.find({}).toArray();
            // console.log(cursor);
            res.send(cursor);
        });

        // Get My Orders 
        app.get('/myOrders', verifyToken, async (req, res) => {
            const email = req.query?.email;

            if (req.decodedUserEmail === email) {
                // console.log('Hitting the post', req.body);
                const query = { receiverEmail: `${email}` };
                const result = await ordersCollection.find(query).toArray();
                console.log(result);
                res.json(result);
            }
            else {
                res.status(401).json({ message: 'User not authorized' });
            }
        });

        // Get All Orders 
        app.get('/orders', verifyToken, async (req, res) => {
            const email = req.query?.email;
            const query = { email: `${email}` };
            const result = await usersCollection.findOne(query);

            if ((req.decodedUserEmail === email) && (result?.role === 'admin')) {
                const searchResult = await ordersCollection.find({}).toArray();
                console.log(searchResult);
                res.json(searchResult);
            }
            else {
                res.status(401).json({ message: 'User not authorized' });
            }
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

        // Add an Order 
        app.post('/addOrder', verifyToken, async (req, res) => {
            const email = req.query?.email;

            if (req.decodedUserEmail === email) {
                // console.log('Hitting the post', req.body);
                const newOrder = req.body;
                const insertResult = await ordersCollection.insertOne(newOrder);
                console.log(insertResult);
                res.json(insertResult);
            }
            else {
                res.status(401).json({ message: 'User not authorized' });
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
                res.status(401).json({ message: 'User not authorized' });
            }
        });

        // Add a Review 
        app.post('/addReview', verifyToken, async (req, res) => {
            const email = req.query?.email;

            if (req.decodedUserEmail === email) {
                // console.log('Hitting the post', req.body);
                const newReview = req.body;
                const insertResult = await reviewsCollection.insertOne(newReview);
                console.log(insertResult);
                res.json(insertResult);

            }
            else {
                res.status(401).json({ message: 'User not authorized' });
            }
        });

        // Update Product Status 
        app.put('/updateProduct', verifyToken, async (req, res) => {
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
                res.status(401).json({ message: 'User not authorized' });
            }
        });

        // Update Order Status 
        app.put('/updateOrder', verifyToken, async (req, res) => {
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

            if ((req.decodedUserEmail === email) || (result?.role === 'admin')) {
                const updateResult = await ordersCollection.updateOne(filter, updateDoc, options);
                console.log(updateResult);
                res.json(updateResult);
            }
            else {
                res.status(401).json({ message: 'User not authorized' });
            }
        });

        // Delete Product 
        app.delete('/deleteProduct', verifyToken, async (req, res) => {
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
                res.status(401).json({ message: 'User not authorized' });
            }
        });

        // Delete Order 
        app.delete('/deleteOrder', verifyToken, async (req, res) => {
            const id = req.body?._id;
            const filter = { _id: ObjectID(id) };

            // Admin Checking 
            const email = req.query?.email;
            const query = { email: `${email}` };
            const result = await usersCollection.findOne(query);

            if ((req.decodedUserEmail === email) || (result?.role === 'admin')) {
                const deleteResult = await ordersCollection.deleteOne(filter);
                console.log(deleteResult);
                res.json(deleteResult);
            }
            else {
                res.status(401).json({ message: 'User not authorized' });
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
                res.status(401).json({ message: 'User not authorized' });
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