const express =require('express');
const cors = require('cors');
const http = require('http');
const {Server} = require ('socket.io');
require('dotenv').config();

const alertapp = express();
const alertserver = http.createServer(alertapp);
const alertio = new Server(alertserver,{cors: {origin: '*'}});

alertapp.use(cors());
alertapp.use(express.json());

const authRoutes = require('./routes/systemauth');
alertapp.use('/api/auth', authRoutes);

const userRoutes = require('./routes/users');
alertapp.use('/api/users', userRoutes);

const reportRoutes = require('/.routes/report');
alertapp.use('api/report', reportRoutes);

alertapp.set('io', alertio);

alertapp.get('/', (req, res)=>{
    res.json({message: 'Hurricane Alert Backend running here.'});

});

alertio.on('connection', (socket)=> {
    console.log(`Device connected: ${socket.id}`);

    socket.on('join_zone', (zone_id)=>{
        socket.join(zone_id);
        console.log(`Device joined zone: ${zone_id}`);
    });

    socket.on('disconnect', ()=> {
        console.log(`Device disconnected: ${socket.id}`);
    });
});

const alertPORT = process.env.PORT || 3000;
alertserver.listen(alertPORT, ()=>{
    console.log(`Server running on http:\\localhost:${alertPORT}`);
});