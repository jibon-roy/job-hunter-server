const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: 'http://localhost:5173' || 'http://localhost:5174',
    credentials: true
}));
app.use(express.json());


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ziw2dg7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const Database = client.db('JobHunterDb')
        const sliderData = Database.collection('sliderData');
        const jobsCollection = Database.collection('jobs');
        const usersCollection = Database.collection('usersData');

        app.get('/sliders', async (req, res) => {
            const sliders = await sliderData.find().toArray();
            res.send(sliders);
        })

        app.post('/jobs', async (req, res) => {
            const jobs = req.body;
            const result = await jobsCollection.insertOne(jobs);
            res.send(result);
        })


        app.post('/users', async (req, res) => {
            const userData = req.body;
            const query = { email: userData.email }
            const existsUser = await usersCollection.findOne(query);
            if (existsUser) {
                return;
            } else {
                const result = usersCollection.insertOne(userData);
                res.send(result);
            }
        })

        app.get('/jobs', async (req, res) => {
            const jobs = await jobsCollection.find().toArray();
            res.send(jobs);
        })

        app.put('/users/:user', async (req, res) => {
            const user = req.params.user;
            const addedJob = req.body;
            const query = { email: user }
            const addJob = {
                $push: {
                    addedJobsId: addedJob
                }

            }
            const result = await usersCollection.updateOne(query, addJob)
            res.send(result);
        })






        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Server is running');
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})