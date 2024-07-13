const express = require("express");
require("dotenv").config();
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const fs = require("fs");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

const htmlContent = fs.readFileSync("Main.html", "utf8");

app.use(cors(corsOptions));
const PORT = process.env.PORT || 5000;

const mongoURI =
  "mongodb+srv://prasaddurga2031:1234@app.lkbwh19.mongodb.net/?retryWrites=true&w=majority";

app.use(bodyParser.json());

async function connectToDB() {
  try {
    const client = new MongoClient(mongoURI, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db("rental");
    console.log("Connected");
    return db;
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
}

// Route: Send Signup Mail
app.put("/signupmail/:id", async (req, res) => {
  const mail = req.params.id;
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "prasaddurga2031@gmail.com",
      pass: "iskcfaubrcdwfoeq",
    },
  });

  const mailOptions = {
    from: "Sai@1234567",
    to: mail,
    subject: "Signup Confirmation",
    text: "Thank you for signing up!",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.json({ status: "Failed to send" });
      console.log("Error sending email:", error);
    } else {
      res.json({ status: "Mail sent successfully" });
      console.log("Email sent:", info.response);
    }
  });
});

// Route: Send Booking Mail
app.put("/postmail/:id", async (req, res) => {
  const mail = req.params.id;
  const userDetails = req.body.BookingDetails || req.body;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "prasaddurga2031@gmail.com",
      pass: "iskcfaubrcdwfoeq",
    },
  });

  const mailOptions = {
    from: "Sai@1234567",
    to: mail,
    subject: "Booking Details",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #007bff;">Booking Confirmation</h2>
          <p>Hello <strong>${userDetails.name}</strong>,</p>
          <p>Thank you for booking with us. Here are your details:</p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>Name:</strong> ${userDetails.name}</li>
            <li><strong>Email:</strong> ${userDetails.address}</li>
            <li><strong>Car Model:</strong> ${userDetails.car_name}</li>
            <li><strong>From Time:</strong> ${userDetails.StartTime}</li>
            <li><strong>To Time:</strong> ${userDetails.EndTime}</li>
          </ul>
          <p>If you have any questions or need assistance, feel free to contact us.</p>
          <p style="margin-top: 20px;">Best regards,</p>
          <p><strong>Big Boy Toyz</strong></p>
        </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.json({ status: "Failed to send" });
      console.log("Error sending email:", error);
    } else {
      res.json({ status: "Mail sent successfully" });
      console.log("Email sent:", info.response);
    }
  });
});

// Route: Send Cancel Mail
app.put("/cancelmail/:id", async (req, res) => {
  const mail = req.params.id;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "prasaddurga2031@gmail.com",
      pass: "iskcfaubrcdwfoeq",
    },
  });

  const mailOptions = {
    from: "Sai@1234567",
    to: mail,
    subject: "Booking Details",
    text: "Your Booking is Cancelled..!",
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      res.json({ status: "Failed to send" });
      console.log("Error sending email:", error);
    } else {
      res.json({ status: "Mail sent successfully" });
      console.log("Email sent:", info.response);
    }
  });
});

// Route: Post Login Credentials
app.post("/postlogcred", async (req, res) => {
  try {
    const newItem = req.body.cred;
    const Check = {
      type: newItem.type,
      user: newItem.user,
    };
    const db = await connectToDB();
    const collection = db.collection("logins");
    const existingCredentials = await collection.findOne(Check);
    if (existingCredentials) {
      res.json({ statUser: "exists" });
      console.log("User already exists");
    } else {
      const result = await collection.insertOne(newItem);
      res.json(result);
      console.log("User created");
    }
  } catch (error) {
    console.error("Error posting login credentials:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Get Login Credentials
app.get("/getlogcred", async (req, res) => {
  try {
    const db = await connectToDB();
    const collection = db.collection("logins");
    const items = await collection.find({}).toArray();
    res.json(items);
  } catch (error) {
    console.error("Error retrieving login credentials:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Get Car Data
app.get("/getdata", async (req, res) => {
  try {
    const currentDateAndTime = new Date();
    const minDate = currentDateAndTime.toISOString();
    const db = await connectToDB();
    const Bookingcollection = db.collection("Bookings");
    const Carcollection = db.collection("carsdata");

    let Bookingitems = await Bookingcollection.find({
      $or: [
        { EndTime: { $gte: minDate } },
        { "BookingDetails.EndTime": { $gte: minDate } },
      ],
    }).toArray();

    let size = Bookingitems.length;
    let Caritems = await Carcollection.find({}).toArray();

    for (let i = 0; i < Caritems.length; i++) {
      if (size === 0) break;
      let flag = false;
      for (let j = 0; j < Bookingitems.length; j++) {
        let d1 = new Date(
          Bookingitems[j]?.EndTime?.split("T")[0] ||
            Bookingitems[j]?.BookingDetails?.EndTime?.split("T")[0]
        );
        let d2 = new Date(currentDateAndTime.toISOString().split("T")[0]);
        if (
          d1 >= d2 &&
          Caritems[i]._id.toString() === Bookingitems[j].BookingDetails.car_id
        ) {
          flag = true;
          size = size - 1;
          break;
        }
      }

      const itemId = Caritems[i]._id;
      let updatedItem = Caritems[i];
      updatedItem.car_status = flag ? "Booked" : "Available";
      const result = await Carcollection.updateOne(
        { _id: new ObjectId(itemId) },
        { $set: updatedItem }
      );
    }
    res.json(Caritems);
  } catch (error) {
    console.error("Error retrieving car data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Add Car Data
app.post("/postcardata", async (req, res) => {
  try {
    const newItem = req.body.carData;
    const db = await connectToDB();
    const collection = db.collection("carsdata");
    const result = await collection.insertOne(newItem);
    res.json(result);
  } catch (error) {
    console.error("Error adding car data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Update Car Data
app.put("/modifycar/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const updatedItem = req.body.carData;
    const db = await connectToDB();
    const collection = db.collection("carsdata");
    const result = await collection.updateOne(
      { _id: new ObjectId(itemId) },
      { $set: updatedItem }
    );
    res.json(
      result.modifiedCount > 0
        ? { message: "Item updated successfully" }
        : { message: "No updates made" }
    );
  } catch (error) {
    console.error("Error updating car data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Delete Car Data
app.delete("/deletecar/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const db = await connectToDB();
    const collection = db.collection("carsdata");
    const result = await collection.deleteOne({ _id: new ObjectId(itemId) });
    res.json(result);
  } catch (error) {
    console.error("Error deleting car data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Add Booking Data
app.post("/postbookdata", async (req, res) => {
  try {
    const newItem = req.body.BookingDetails;
    const db = await connectToDB();
    const collection = db.collection("Bookings");
    const result = await collection.insertOne(newItem);
    res.json(result);
  } catch (error) {
    console.error("Error adding booking data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Update Booking Data
app.put("/modifybooking/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const updatedItem = req.body.BookingDetails;
    const db = await connectToDB();
    const collection = db.collection("Bookings");
    const result = await collection.updateOne(
      { _id: new ObjectId(itemId) },
      { $set: updatedItem }
    );
    res.json(
      result.modifiedCount > 0
        ? { message: "Booking updated successfully" }
        : { message: "No updates made" }
    );
  } catch (error) {
    console.error("Error updating booking data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Delete Booking Data
app.delete("/deletebooking/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    const db = await connectToDB();
    const collection = db.collection("Bookings");
    const result = await collection.deleteOne({ _id: new ObjectId(itemId) });
    res.json(result);
  } catch (error) {
    console.error("Error deleting booking data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Route: Get Bookings

// Route to get all booking data
app.get("/bookingsdata", async (req, res) => {
  try {
    const db = await connectToDB();
    const collection = db.collection("Bookings");
    const items = await collection.find({}).toArray();
    res.json(items);
  } catch (error) {
    console.error("Error fetching booking data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Route: Fetch HTML Content
app.get("/", (req, res) => {
  res.send(htmlContent);
});

//----------------------------------------Staring Server---------------------------

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  connectToDB();
});
