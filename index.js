const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8000;

// Middlewares
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello world");
});

console.log(
  "DB_USER:",
  process.env.DB_USER,
  "DB_PASSWORD:",
  process.env.DB_PASSWORD
);

//const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@hero-one.z3ku6ig.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://motiur-chember:VTepYGfior8HzI9J@hero-one.z3ku6ig.mongodb.net/?retryWrites=true&w=majority`;
console.log("Mongo URI:", uri);

console.log("Mongo URI:", uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    await client.connect(); // 👈 IMPORTANT

    const userCollection = client.db("motiurChember").collection("users");
    const serviceCollection = client.db("motiurChember").collection("services");
    const reviewsCollection = client.db("motiurChember").collection("reviews");

    app.post("/jwt", (req, res) => {
      const userEmail = req.body;
      const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Add Service
    app.post("/add_service", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });

    // Get all services
    app.get("/service", async (req, res) => {
      const services = await serviceCollection.find({}).toArray();
      res.send(services);
    });

    // Get first 3 services
    app.get("/service_withlimit", async (req, res) => {
      const services = await serviceCollection
        .find({})
        .sort({ _id: -1 })
        .limit(3)
        .toArray();
      res.send(services);
    });

    // Get specific service
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const option = { _id: new ObjectId(id) };
      const service = await serviceCollection.findOne(option);
      if (!service) {
        return res.status(404).send({ message: "Service not found" });
      }
      res.send(service);
    });

    // Service Count
    app.get("/service_count", async (req, res) => {
      const totalItem = await serviceCollection.countDocuments({});
      res.send({ totalItem });
    });

    // Add Review
    app.post("/review", async (req, res) => {
      const userReview = {
        ...req.body,
        dateAdded: new Date(),
      };
      const result = await reviewsCollection.insertOne(userReview);
      res.send(result);
    });

    // Reviews for a service
    app.get("/review/:id", async (req, res) => {
      const id = req.params.id;
      const review = await reviewsCollection
        .find({ service_id: id })
        .sort({ _id: -1 })
        .toArray();
      res.send(review);
    });

    // My reviews (protected)
    app.get("/myreviews", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      const email = req.query.email;

      if (decoded.email !== email) {
        return res.status(401).send({ message: "unauthorized access" });
      }

      const review = await reviewsCollection
        .find({ email })
        .sort({ _id: -1 })
        .toArray();

      res.send(review);
    });

    // Specific review
    app.get("/myreview/:id", async (req, res) => {
      const id = req.params.id;
      const review = await reviewsCollection
        .find({ _id: new ObjectId(id) })
        .toArray();
      res.send(review);
    });

    // Delete My Review
    app.delete("/myreview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewsCollection.deleteOne(query);
      res.send(result);
    });

    // Update My Review
    app.patch("/myreview/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const review = req.body.review;
      const updateDoc = {
        $set: { review },
      };
      const result = await reviewsCollection.updateOne(query, updateDoc);
      res.send(result);
    });
  } finally {
    // keep the client open for dev
  }
}

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
