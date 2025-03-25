require('dotenv').config();
//console.log("DB_URL:", process.env.DB_URL);
const express = require('express');
const cors = require('cors');
const app = express();

const dns = require('dns')
const urlparser = require('url')

// * Im using MongoDB for Shortner URL
const { MongoClient } = require('mongodb')
const client = new MongoClient(process.env.DB_URL)


async function connectDB() {
  try {
    await client.connect(); // ✅ Ensure connection before using
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

connectDB(); // Call this function on startup

const db = client.db("urlshortner");
const urls = db.collection("urls");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  console.log(req.body.url)
  const url = req.body.url
  const hostname = new URL(url).hostname;
  dns.lookup(hostname, async(err, address) => {
    if(!address){
       res.json({error: "Invalid URL"})
    }else{
       const urlCount = await urls.countDocuments({})
       const urlDoc   = {
         url,
         short_url: urlCount
       }
       const result = await urls.insertOne(urlDoc)
       res.json({original_url: url, short_url: urlCount})
    }
})
  //res.json({ greeting: 'hello API' });
});

app.get("/api/shorturl/:short_url", async (req, res) => {
  try {
    const shorturl = parseInt(req.params.short_url);
    console.log("Looking up short URL:", shorturl);

    const urlDoc = await urls.findOne({ short_url: shorturl });

    if (!urlDoc) {
      console.log("Short URL not found:", shorturl);
      return res.status(404).json({ error: "Short URL not found" });
    }

    console.log("Redirecting to:", urlDoc.url);
    res.redirect(urlDoc.url);
    
  } catch (err) {
    console.error("Error fetching short URL:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
