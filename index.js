const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8000;

//middle wares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});

console.log(process.env.DB_USER, process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@hero-one.z3ku6ig.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorization access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorization access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const userCollection = client.db("motiurChember").collection("users");
    const serviceCollection = client.db("motiurChember").collection("services");
    const reviewsCollection = client.db("motiurChember").collection("reviews");

    app.post("/jwt", (req, res) => {
      const userEmail = req.body;
      var token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Add Servicess
    app.post("/add_service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // Get all services
    app.get("/service", async (req, res) => {
      const cursor = await serviceCollection.find({});
      const services = await cursor.toArray();
      res.send(services);
    });

    // Get first 3 services
    app.get("/service_withlimit", async (req, res) => {
      const cursor = await serviceCollection
        .find({})
        .limit(3)
        .sort({ _id: -1 });
      const services = await cursor.toArray();
      res.send(services);
    });

    // Get specific services
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const option = { _id: ObjectId(id) };
      const cursor = await serviceCollection.find(option);
      const services = await cursor.toArray();
      res.send(services);
    });

    // Service Count
    app.get("/service_count", async (req, res) => {
      const totalItem = await serviceCollection.countDocuments({});
      res.send({ totalItem });
    });

    // Review section

    // Add Review
    app.post("/review", async (req, res) => {
      const userReview = req.body;
      userReview.dateAdded = new Date();
      const result = await reviewsCollection.insertOne(userReview);
      res.send(result);
    });

    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const cursor = reviewsCollection
        .find({ service_id: id })
        .sort({ _id: -1 });
      const review = await cursor.toArray();
      res.send(review);
    });

    app.get("/myreviews", async (req, res) => {
      //const decode = req.decoded;
      const email = req.query.email;
      // console.log("inside order API", req.headers);
      // if (decode.email != email) {
      //   return res.status(401).send({ message: "unauthorization access" });
      // }
      const cursor = reviewsCollection.find({ email: email }).sort({ _id: -1 });
      const review = await cursor.toArray();
      console.log(review);
      res.send(review);
    });

    //specific review
    app.get("/myreview/:id", async (req, res) => {
      const id = req.params.id;
      const cursor = reviewsCollection.find({ _id: ObjectId(id) });
      const review = await cursor.toArray();
      res.send(review);
    });

    // Delete My Review
    app.delete("/myreview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    // Update My Review
    //patch API
    app.patch("/myreview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const review = req.body.review;
      const updateDoc = {
        $set: {
          review: review,
        },
      };
      const result = await reviewsCollection.updateOne(query, updateDoc);
      res.send(result);
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
