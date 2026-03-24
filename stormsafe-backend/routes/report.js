const express = require('express');
const dbpool = require('../db');
const verifytoken = require('../middleware/systemauth');
const multer = require('multer');
const exifReader = require('exif-reader');
const fs = require('fs');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path_upload = 'uploads/';
        if (!fs.existsSync(path_upload)){
            fs.mkdirSync(path_upload, {recursive: true});
        }
        cb(null, path_upload);
    },
    filename: (req, file, cb) => {
        const unique = `${Date.now()}_${file.originalname}`;
        cb(null, unique);
    }
});

const FileFilter = (req, file, cb) => {
    const allowedFiles = ['image/jpeg', 'image/png', 'image/jpg'];
    if(allowedFiles.includes(file.mimetype)){
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG & PNG allowed.'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: FileFilter });

const extractGPSFromPhoto = (filePath) => {
    try{
        const buffer = fs.readFileSync(filePath);
        const metadata = exifReader(buffer);

        if(metadata && metadata.gps){
            const {GPSLatitude, GPSLatitudeRef, GPSLongitude, GPSLongitudeRef} = metadata.gps;

            if(GPSLatitude && GPSLongitude){
                const lat = convertGPSToDecimal(GPSLatitude, GPSLatitudeRef);
                const lon = convertGPSToDecimal(GPSLongitude, GPSLongitudeRef);
                return {latitude: lat, longitude: lon};
            }
        }
        return null;
    }catch(err){
        console.error('EXIF extraction error:', err.message);
        return null;
    }
};


const convertGPSToDecimal = (gpsData, direction) => {
    const [degrees, minutes, seconds] = gpsData;

    let decimal = degrees + (minutes / 60) + (seconds / 3600);

    if(direction === 'S' || direction === 'W'){
        decimal = decimal * -1;
    }
    return parseFloat(decimal).toFixed(6);
};

router.post('/report', verifytoken, async(req, res)=>{
    const {report_type, description, latitude, longitude, urgency_level, sent_mode} = req.body;

    const userID = req.user.userID;

    if(!report_type || !latitude || !longitude || !urgency_level || !sent_mode){
        return res.status(400).json({error: 'All fields are required.'});
    }

    try{
        const issue = await dbpool.query(
            `INSERT INTO emergencyReports (userID, report_type, description, latitude, longitude, urgency_level, status, sent_mode, created_at)
            VALUES ($1, $2, $3, $4, $5, $6,'PENDING', $7, NOW()) RETURNING *`, 
            [userID, report_type, description, latitude, longitude, urgency_level, sent_mode]
        );

        const report = issue.rows[0];

        res.status(201).json({message: 'Report submitted successfully.', report});

    }catch(err){
        console.error('Report submission error:', err.message);
        res.status(500).json({error: 'Error submitting report.'});
    }
});

router.post('/photo/:reportID', verifytoken, upload.single('photo'), async(req, res)=>{
    const {reportID} = req.params;
    const userID = req.user.userID;

    if(!req.file){
        return res.status(400).json({error: 'No photo uploaded.'});
    }

    try{
        const validateReport = await dbpool.query(
            `SELECT reportID, latitude, longitude FROM emergencyReports WHERE reportID = $1 AND userID = $2`,
            [reportID, userID]
        );

        if(validateReport.rows.length === 0){
            return res.status(404).json({error: 'Report not found or does not belong to the user'});
            }

        const file = req.file.path;

        const exifGPS = extractGPSFromPhoto(file);

        const photos = await dbpool.query(
            `INSERT INTO reportPhotos (reportID, photo_path, uploaded_at)
            VALUES ($1, $2, NOW()) RETURNING *`,
            [reportID, file]
        );

        if(exifGPS){
            const thisReport = validateReport.rows[0];

            if(!thisReport.latitude && !thisReport.longitude){
                await dbpool.query(
                    `UPDATE emergencyReports SET latitude = $1, longitude = $2 WHERE reportID = $3`,
                    [exifGPS.latitude, exifGPS.longitude, reportID]
                );
            }
        }

        res.status(201).json({
            message: 'Photo uploaded successfully.', 
            photo: photos.rows[0],
            exif_location: exifGPS 
            ? {
                latitude: exifGPS.latitude, 
                longitude: exifGPS.longitude,
                mapurl: `https://www.openstreetmap.org/?mlat=${exifGPS.latitude}&mlon=${exifGPS.longitude}&zoom=15`
            } :'No GPS data in photo metadata.'
});
    } catch(err){
        console.error('Photo upload error:', err.message);
        res.status(500).json({error: 'Error uploading photo.'});
    }
});

router.get('/userreport', verifytoken, async(req, res)=>{
    const userID = req.user.userID;

    try{
        const reportResult = await dbpool.query(
            `SELECT r.*,
                 COALESCE(
                    json_agg(p.photo_path) FILTER (WHERE p.photo_path IS NOT NULL), '[]'
                    ) AS photos
            FROM emergencyReports r
            LEFT JOIN reportPhotos p ON r.reportID = p.reportID
            WHERE  r.userID = $1
            GROUP BY r.reportID
            ORDER BY r.created_at DESC`,

            [userID]
        );


        res.json({report: reportResult.rows});

    }catch(err){
        console.error('Error fetching report:', err.message);
        res.status(500).json({error: 'Server error fetching report.'});
    }
});

router.get('/:reportID', verifytoken, async(req, res)=>{
    const {reportID} = req.params;
    const userID = req.user.userID;

    try{
        const reportResult = await dbpool.query(
            `SELECT r.*,
                 COALESCE(
                    json_agg(p.photo_path) FILTER (WHERE p.photo_path IS NOT NULL), '[]'
                    ) AS photos
            FROM emergencyReports r
            LEFT JOIN reportPhotos p ON r.reportID = p.reportID
            WHERE r.reportID = $1 AND r.userID = $2
            GROUP BY r.reportID`,
            [reportID, userID]
        );

        if(reportResult.rows.length === 0){
            return res.status(404).json({error: 'Report not found or does not belong to the user.'});
        }

        res.json({report: reportResult.rows[0]});

    }catch(err){
        console.error('Error fetching report:', err.message);
        res.status(500).json({error: 'Server error fetching report.'});
    }
});

router.put('/status/:reportID', verifytoken, async(req, res)=>{
    const {reportID} = req.params;
    const {status} = req.body;
    const userID = req.user.userID;

    const validStatus = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];

    if(!validStatus.includes(status) || !status){
        return res.status(400).json({error: 'Invalid status value.'});
    }

    try{
        const update = await dbpool.query(
            `UPDATE emergencyReports SET status = $1 WHERE reportID = $2 AND userID = $3 RETURNING *`,
            [status, reportID, userID]
        );

        if(update.rows.length === 0){
            return res.status(404).json({error: 'Report not found or does not belong to the user.'});
        }


        res.json({message: 'Report status updated successfully.', report: update.rows[0]});

    }catch(err){
        console.error('Error updating report status:', err.message);
        res.status(500).json({error: 'Server error updating report status.'});
    }

});

router.post('/sync', verifytoken, async(req, res)=>{
    const {reports} = req.body;
    const userID = req.user.userID;
    const syncResults = {saved: 0, duplicates: 0, errors:0};

    if(!reports || reports.length === 0){
        return res.status(400).json({error: 'No reports to sync.'});
    }

    for(const report of reports){
        try{
            const duplicateCheck = await dbpool.query(
                `SELECT reportID FROM emergencyReports
                WHERE reportID =$1`,
                [report.reportID]
            );

            if(duplicateCheck.rows.length > 0){
                syncResults.duplicates += 1;
                continue;
            }

            await dbpool.query(
                `INSERT INTO emergencyReports (reportID, userID, report_type, description, latitude, longitude, urgency_level, status, sent_mode, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9)`,
                [report.reportID, userID, report.report_type, report.description, report.latitude, report.longitude,
                    report.urgency_level, report.sent_mode, report.created_at]
                
            );

            syncResults.saved += 1;

        }catch(err){
            console.error(`Error syncing report`, err.message);
            syncResults.errors += 1;
        }
    }

    res.json({message: 'Sync completed.', results: syncResults});

});

router.delete('/:reportID', verifytoken, async(req, res)=>{
    const {reportID} = req.params;
    const userID = req.user.userID;

    try{
        const deleteReport = await dbpool.query(
            `DELETE FROM emergencyReports WHERE reportID = $1 AND userID = $2 RETURNING reportID`,
            [reportID, userID]
        );

        if(deleteReport.rows.length === 0){
            return res.status(404).json({error: 'Report not found or does not belong to the user.'});
        }

        res.json({message: 'Report deleted successfully.'});

    }catch(err){
        console.error('Error deleting report:', err.message);
        res.status(500).json({error: 'Server error deleting report.'});
    }
});


module.exports = router;

