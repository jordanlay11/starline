const express = require("express"); //Import the Express framework to create the server and define routes for handling HTTP requests
const cors = require("cors"); //Import the CORS middleware to enable Cross-Origin Resource Sharing
const http = require("http"); //Import the built-in HTTP module to create an HTTP server that can be used with Socket.IO for real-time communication
const { Server } = require("socket.io"); //Import the Server class from the Socket.IO library to create a WebSocket server for real-time communication with clients
require("dotenv").config(); //Load environment variables from a .env file into process.env, allowing the application to access configuration settings such as database credentials and JWT secret keys

const alertapp = express(); //create an instance of the Express application to define routes and middleware for handling HTTP requests
const alertserver = http.createServer(alertapp); //create an HTTP server using the Express application, which will be used to handle incoming HTTP requests and can also be used with Socket.IO for real-time communication
const alertio = new Server(alertserver, { cors: { origin: "*" } }); //create a new Socket.IO server instance that listens for WebSocket connections on the HTTP server, and configure it to allow cross-origin requests from any origin

alertapp.use(cors());
alertapp.use(express.json());

//Serve static files from the 'uploads' directory when requests are made to the '/uploads' route, allowing clients to access uploaded files such as images or documents
alertapp.use("/uploads", express.static("uploads"));

//Attach the Socket.IO server instance to the Express application
alertapp.set("io", alertio);

//Import and use route handlers for authentication, user management, and report handling, defining the base paths for each set of routes to organize the API endpoints
const authRoutes = require("./routes/systemauth");
alertapp.use("/api/auth", authRoutes);

//Import and use route handlers for user management, making them accessible under the '/api/users' path, allowing clients to access endpoints for updating user location and other user-related operations
const userRoutes = require("./routes/users");
alertapp.use("/api/users", userRoutes);

//Import and use route handlers for report handling, making them accessible under the '/api/report' path, allowing clients to access endpoints for submitting and managing reports related to hurricane alerts
const reportRoutes = require("./routes/report");
alertapp.use("/api/reports", reportRoutes);

//Define a simple route for the root URL that responds with a JSON message indicating that the Hurricane Alert Backend is running
alertapp.get("/", (req, res) => {
  res.json({ message: "Hurricane Alert Backend running here." });
});

//Set up event listeners for Socket.IO to handle real-time communication with connected clients
alertio.on("connection", (socket) => {
  console.log(`Device connected: ${socket.id}`); //Log the unique identifier of each connected device for monitoring purposes

  socket.on("join_zone", (zone_id) => {
    //Listen for a 'join_zone' event from the client
    socket.join(zone_id); //Add the device to a Socket.IO room corresponding to the specified zone ID
    console.log(`Device joined zone: ${zone_id}`); //Log the zone ID that the device has joined for monitoring purposes
  });

  socket.on("disconnect", () => {
    console.log(`Device disconnected: ${socket.id}`); //Log the unique identifier of each disconnected device for monitoring purposes
  });
});

//Start the HTTP server and listen on the specified port
const alertPORT = process.env.PORT || 3000;
alertserver.listen(alertPORT, () => {
  console.log(`Server running on http:\\localhost:${alertPORT}`);
});
