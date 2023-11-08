const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// https://job-hunter-site.web.app
// middleware
app.use(cors({
    origin: 'https://job-hunter-site.web.app' || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

        app.get('/jobs/home', async (req, res) => {
            const jobs = await jobsCollection.find().limit(4).toArray();
            res.send(jobs);
        })

        app.get('/jobs', async (req, res) => {
            const jobs = await jobsCollection.find().toArray();
            res.send(jobs);
        })

        app.get('/jobs/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const jobs = await jobsCollection.find(query).toArray();
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

        // add my bid data 

        app.put('/user/bid', async (req, res) => {
            const user = req.query.setEmail;
            const bidedJob = req.body;
            const query = { email: user }
            const bidJob = {
                $push: {
                    bidJobsData: bidedJob
                }
            }
            const result = await usersCollection.updateOne(query, bidJob)
            res.send(result);
        })

        app.put('/user/request', async (req, res) => {
            const data = req.body
            const id = req.query.jobId;
            const query = { _id: new ObjectId(id) }
            const bidJob = {
                $push: {
                    bidUsers: data
                }
            }
            const result = await jobsCollection.updateOne(query, bidJob)
            res.send(result);
        }
        )

        app.put('/user/status', async (req, res) => {
            const data = req.body
            const email = req.query.email;
            const option = { upsert: true }
            const query = {
                email: email
            }
            const status = {
                $set: {
                    bidJobsData:
                        [{
                            jobId: data.jobId,
                            title: data.title,
                            employee: data.employee,
                            amount: data.amount,
                            deadline: data.deadline,
                            status: data.status,
                        }]

                }
            }
            const result = await usersCollection.updateOne(query, status, option)
            res.send(result);
        }
        )

        // app.get('/user/status', async (req, res) => {
        //     const data = req.body
        //     const emails = req.query.email;
        //     const jobIds = req.query.jobId;
        //     console.log(data.status, jobIds, emails);
        //     const query = {
        //         email: emails
        //     }
        //     // const status = {
        //     //     $set: {
        //     //         bidJobsData: [
        //     //             {
        //     //                 status: data.status
        //     //             }
        //     //         ]
        //     //     }
        //     // }
        //     const result = await usersCollection.findOne(query)
        //     res.send(result);
        // }
        // )


        app.get('/posted', async (req, res) => {
            const userEmail = req.query.email;
            const find = { email: userEmail }
            const postedJob = await usersCollection.findOne(find)
            res.send(postedJob);
        })

        app.get('/myPostedJobs', async (req, res) => {
            const userEmail = req.query.email;
            const findData = {
                employeeEmail: userEmail
            }
            const myPostedJob = await jobsCollection.find(findData).toArray()
            res.send(myPostedJob);
        })

        app.get('/postedData', async (req, res) => {
            const postId = req.query.postId;
            const find = { _id: new ObjectId(postId) }
            const jobData = await jobsCollection.findOne(find)
            res.send(jobData);
        })

        app.delete('/postedData', async (req, res) => {
            const postId = req.query.postId;
            const find = { _id: new ObjectId(postId) }
            const jobData = await jobsCollection.deleteOne(find)
            res.send(jobData);
        })

        app.delete('/deleteJobDataFromUser', async (req, res) => {
            const user = req.query.email;
            const postId = req.query.postId;
            const query = { email: user }
            const removeJob = {
                $pull: {
                    addedJobsId: [postId]
                }
            }
            const result = await usersCollection.updateOne(query, removeJob)
            res.send(result);
        })



        app.put('/updateJob', async (req, res) => {
            const updateJob = req.body;
            const postId = updateJob?.post?._id;
            const query = { _id: new ObjectId(postId) }
            const updateData = {
                $set: {
                    jobTitle: updateJob.jobTitle,
                    deadline: updateJob.deadline,
                    category: updateJob.category,
                    minPrice: updateJob.minPrice,
                    maxPrice: updateJob.maxPrice,
                    jobDescription: updateJob.jobDescription
                }
            }

            const result = await jobsCollection.findOneAndUpdate(query, updateData)
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