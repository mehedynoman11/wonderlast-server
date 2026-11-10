import express from 'express'
import dotenv from 'dotenv/config'
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose';


const app = express()
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const client = new MongoClient(process.env.MONGODB_URL);
export const connectToMongoDB = async () => {
  try {
    await client.connect();
    console.log("MongoDB connected successfully!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
const connectToClient = await connectToMongoDB();
const db = connectToClient.db("wonderlast");
const destination = db.collection("user_data");
const bookingCollection = db.collection("bookings");

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "unautorized" });
  }
  // console.log(authHeader);
  const token = authHeader.split(" ")[1];
  // console.log(token)
  if (!token) {
    return res.status(401).send({ msg: "unautorized" });
  }

  const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`))
  try {
    const { payload } = await jwtVerify(token, JWKS);
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error!" });
  }
}

app.get('/', (req, res) => {
  res.send({ 'message': 'Server is Running!' })
})

app.post('/add-destination',verifyToken, async (req, res) => {
  const data = req.body;
  const result = await destination.insertOne(data);
  console.log(result);
  res.send(result)
})


app.get('/destination', async (req, res) => {

  const result = await destination.find().toArray();
  res.send(result);
})

app.get('/destination/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const query = { _id: new ObjectId(id) };
  const result = await destination.findOne(query);
  res.send(result)
})

app.patch('/destination/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const result = await destination.updateOne(
    { _id: new ObjectId(id) },
    { $set: data }
  )
  res.json(result)

})

app.delete('/destination/:id', async (req, res) => {
  const { id } = req.params;
  const result = await destination.deleteOne({ _id: new ObjectId(id) });
  res.json(result)

})

app.post('/booking', async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);
  res.send(result);
})

app.get('/my-bookings/:email', async (req, res) => {
  const { email } = req.params
  const result = await bookingCollection.find({ email: email }).toArray();
  res.send(result);
})

const date = new Date();

app.listen(port, () => {
  console.log(`App listening on port ${port} at ${date.toTimeString()}`)
})