const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



require("dotenv").config()
//Database connection

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.3e6mwvl.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send('unauthorize access')
    }
    const token = authHeader.split(' ')[1]
    console.log(token)
    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            console.log(err);
            return res.status(403).send({ message: 'forbidden access hoise' })
        }

        req.decoded = decoded;
        next()
    })
}
async function run() {
    try {
        const ProductsCollection = client.db("Taske").collection("Products");




        app.post('/item', async (req, res) => {
            const product = req.body
            const result = await ProductsCollection.insertOne(product)
            res.send(result)
        })

        app.get('/products', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const search = req.query.search
            console.log(search);
            let query = {};
            if (search.length) {
                query = {
                    $text: {
                        $search: search
                    }
                }

            }
            const cursor = ProductsCollection.find(query);
            const products = await cursor.skip(page * size).limit(size).toArray();
            const count = await ProductsCollection.estimatedDocumentCount();
            res.send({ count, products });
        });

        app.delete("/products/:id", async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await ProductsCollection.deleteOne(query)
            res.send(result)
        })





        // task update
        app.put('/updateTask', async (req, res) => {
            const id = req.query.id;
            console.log(id)
            const updatedData = req.body;
            console.log(updatedData)
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    name: updatedData.name,
                    price: updatedData.price
                },
            };
            const result = await ProductsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
    }
    finally {

    }
}

run().catch(err => console.log(err))


app.get('/', async (req, res) => {
    res.send('Taskey server is running');
})

app.listen(port, () => console.log(`Taskey running on ${port}`))
