const express = require('express');
const dbpool = require('../db');
const verifytoken = require('../middleware/systemauth');
const turf = require('@turf/turf');
const axios = require('axios');
const router = express.Router();

const getLocation = async(latitude, longitude)=>{
    try{
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse`,{
                params:{
                    lat: latitude,
                    lon: longitude,
                    format: 'json'
                },
                headers:{
                    'User-Agent': 'HurricaneAlertJA/1.0Capstone'
                }
            }
        );
        return response.data.display_name || 'Unknown Location';
    }catch(err){
        console.error('Geocoding error:', err.message);
        return 'Unknown Location';
    }
};

const matchRiskZone = async(latitude, longitude)=> {
    const zone = await dbpool.query(
        `SELECT zoneID, zone_name, risk_level, boundary FROM risk_zones`
    );

    const point = turf.point([longitude,latitude]);
       
        for (const zones of zone.rows){
            const poly = turf.polygon(zones.boundary.coordinates);
            if(turf.booleanPointInPolygon(point,poly)){
                return zones;
            }


        }

    return null;
};

router.put('/location', verifytoken, async(req, res)=>{
    const {latitude, longitude} = req.body;
    const userID = req.user.userID;

    if(!latitude || !longitude){
        return res.status(400).json({message: 'Latitude and longitude are required.'});
    }

    try{
        const location = await getLocation(latitude, longitude);

        const zoneMatch = await matchRiskZone(latitude, longitude);

        const riskLevel = zoneMatch ? zoneMatch.risk_level : 'LOW';
        const zoneRiskID = zoneMatch ? zoneMatch.zoneID : null;

       await dbpool.query(
            `INSERT INTO userLocations (userID, latitude, longitude, location, riskLevel, zoneRiskID)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [userID, latitude, longitude, location, riskLevel, zoneRiskID]
        );
       
       
        await dbpool.query(
            `UPDATE users 
            SET lastActive = Now() WHERE userID = $1`,
            [userID]
        );
        res.json({message: 'Location updated successfully.', 
            location, latitude, longitude, riskLevel,

        zone: zoneMatch ? zoneMatch.zone_name : 'Unknown Zone',
        mapurl: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`});
    }catch(err){
        console.error('Error updating location:', err.message);
        res.status(500).json({message: 'Server error updating location.'});
    }
 });

router.get('/location/current', verifytoken, async(req, res)=>{
    const userID = req.user.userID;
    try{
        const locationResult = await dbpool.query(
            `SELECT * FROM userLocations
            WHERE userID = $1
            ORDER BY timestamped_at DESC
            LIMIT 1`,
            [userID]
        );

        if(locationResult.rows.length === 0){
            return res.status(404).json({message: 'Location data not found for this user.'});
        }

        const locationData = locationResult.rows[0];
        const mapurl = `https://www.openstreetmap.org/?mlat=${locationData.latitude}&mlon=${locationData.longitude}&zoom=15`;

        res.json({location:{ ...locationData, mapurl}});
    }catch(err){
        console.error('Error fetching location:', err.message);
        res.status(500).json({message: 'Server error fetching location.'});
    }
});

router.get('/location/history', verifytoken, async(req, res)=>{
    const userID = req.user.userID;
    try{
        const historyResult = await dbpool.query(
            `SELECT * FROM userLocations
            WHERE userID = $1
            ORDER BY timestamped_at DESC`,
            [userID]
        );

        res.json({locations: historyResult.rows});
    }catch(err){
        console.error('Error fetching location history:', err.message);
        res.status(500).json({message: 'Server error fetching location history.'});
    }
});

router.get('/userprofile', verifytoken, async(req, res)=>{
    const userID = req.user.userID;

    try{
        const userResult = await dbpool.query(
            `SELECT userID, name, email, phone_number, lastActive FROM users WHERE userID = $1`, [userID]
        );

        if(userResult.rows.length === 0){
            return res.status(404).json({message: 'User not found.'});
        }

        const user = userResult.rows[0];

        const locationResult = await dbpool.query(
            `SELECT latitude, longitude, location, "riskLevel", timestamped_at FROM userLocations
            WHERE userID = $1
            ORDER BY timestamped_at DESC LIMIT 1`, 
            [userID]
        );

        const latestLocation = locationResult.rows[0] ||null;
        const mapurl = latestLocation ? `https://www.openstreetmap.org/?mlat=${latestLocation.latitude}&mlon=${latestLocation.longitude}&zoom=15` : null;

        res.json({
            user: {
                ...user,
                location: latestLocation ? latestLocation.location : 'No location data',
                riskLevel: latestLocation ? latestLocation.riskLevel : 'LOW',
                mapurl
            }
        });
    } catch(err){
        console.error('Error fetching user profile:', err.message);
        res.status(500).json({message: 'Server error fetching user profile.'});
    }
});

router.get('/riskzone', verifytoken, async(req, res)=>{
    try{
        const zonesResult = await dbpool.query(
            `SELECT zoneID, zone_name, risk_level, ST_AsGeoJSON(boundary) as boundary, parish,
             description, danger_score, threat_level
             FROM risk_zones
             ORDER By
                   CASE risk_level
                       WHEN 'HIGH' THEN 1
                       WHEN 'MODERATE' THEN 2
                       WHEN 'LOW' THEN 3
                   END`
        );

        res.json({zones: zonesResult.rows});
    } catch(err){
        console.error('Error fetching risk zones:', err.message);
        res.status(500).json({message: 'Server error fetching risk zones.'});
    }
});

router.get('/location/resolve', verifytoken, async(req, res)=>{
    const {latitude, longitude} = req.query;

    if(!latitude || !longitude){
        return res.status(400).json({message: 'Latitude and longitude are required.'});
    }

    try{
        const location = await getLocation(latitude, longitude);
        const zoneMatch = await matchRiskZone(latitude, longitude);
        const mapurl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`;

        res.json({
            location,
            latitude,
            longitude,
            riskLevel: zoneMatch ? zoneMatch.risk_level : 'LOW',
            zone: zoneMatch ? zoneMatch.zone_name : 'Unknown Zone',
            mapurl
        });
    }catch(err){
        console.error('Error resolving location:', err.message);
        res.status(500).json({message: 'Server error resolving location.'});
    }   
});

module.exports = router;