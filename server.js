// Built-in Node.js modules
let path = require('path');

// NPM modules
let express = require('express');
let sqlite3 = require('sqlite3');


let app = express();
let port = 8000;

let public_dir = path.join(__dirname, 'public');
let template_dir = path.join(__dirname, 'templates');
let db_filename = path.join(__dirname, 'db', 'stpaul_crime.sqlite3');

// open stpaul_crime.sqlite3 database
// data source: https://information.stpaul.gov/Public-Safety/Crime-Incident-Report-Dataset/gppb-g9cg
let db = new sqlite3.Database(db_filename, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.log('Error opening ' + db_filename);
    }
    else {
        console.log('Now connected to ' + db_filename);
    }
});

app.use(express.static(public_dir));


// REST API: GET /codes
// Respond with list of codes and their corresponding incident type
app.get('/codes', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let codeList = url.searchParams.get('code');

    let sqlQuery = 'SELECT * From Codes ORDER BY code';
    if(codeList != null){
        sqlQuery = 'SELECT * From Codes WHERE code IN ('+ codeList +') ORDER BY code'
    }
    
    Promise.all([databaseSelect(sqlQuery)]).then((results) => {
        res.status(200).type('json').send(results[0]);
    }).catch(error => { 
        console.error(error.message);
    });
});

// REST API: GET /neighborhoods
// Respond with list of neighborhood ids and their corresponding neighborhood name
app.get('/neighborhoods', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let idVal = url.searchParams.get('id');
    let sql = "SELECT * FROM Neighborhoods ORDER BY neighborhood_number";
    if(idVal !== null) {
        sql = "SELECT * FROM Neighborhoods WHERE neighborhood_number IN (" + idVal + ") ORDER BY neighborhood_number";
    }
    Promise.all([databaseSelect(sql)]).then((results) => {
        res.status(200).type('json').send(results[0]);
    }).catch(error => { 
        console.error(error.message);
    });
});

// REST API: GET/incidents
// Respond with list of crime incidents
app.get('/incidents', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    res.status(200).type('json').send({});
});

// REST API: PUT /new-incident
// Respond with 'success' or 'error'
app.put('/new-incident', (req, res) => {

    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);
    let case_numberVal = url.searchParams.get('case_number');
    let dateVal = url.searchParams.get('date');
    let timeVal = url.searchParams.get('time');
    let codeVal = parseInt(url.searchParams.get('code'));
    let incidentVal = url.searchParams.get('incident');
    let police_gridVal = parseInt(url.searchParams.get('police_grid'));
    let neighborhood_numberVal = parseInt(url.searchParams.get('neighborhood_number'));
    let blockVal = url.searchParams.get('block');

    let dateTimeVal = dateVal + timeVal;

    let sql = "INSERT INTO Incidents (case_number, date_time, code, incident, police_grid, neighborhood_number, block) " +
              "VALUES (\'" + case_numberVal + "\', \'" + 
              dateTimeVal + "\', " +
              codeVal + ", \'" +
              incidentVal + "\', " +
              police_gridVal + ", " +
              neighborhood_numberVal + ", \'" +
              blockVal + "\')";

    Promise.all([databaseInsert(sql)]).then((results) => {
        res.status(200).type('txt').send('success');
    }).catch((err) => {
        res.status(500).type('txt').send('failure');
    });
});


// Create Promise for SQLite3 database SELECT query 
function databaseSelect(query, params) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(rows);
            }
        })
    })
}

// Create Promise for SQLite3 database INSERT query
function databaseInsert(query, params) {
    return new Promise((resolve, reject) => {
        db.run(query, params, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    })
}


// Start server
app.listen(port, () => {
    console.log('Now listening on port ' + port);
});
