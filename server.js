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
    
    res.status(200).type('json').send({});
});

// REST API: GET /neighborhoods
// Respond with list of neighborhood ids and their corresponding neighborhood name
app.get('/neighborhoods', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    res.status(200).type('json').send({});
});


// REST API: GET/incidents
// Respond with list of crime incidents
//Return JSON object with list of crime incidents (ordered by date/time). Note date and time should be separate fields.
app.get('/incidents', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    let start_date = url.searchParams.get('start_date');
    let end_date = url.searchParams.get('end_date');
    let codes = url.searchParams.get('code');
    let grids = url.searchParams.get('grid');
    let neighborhoods =  url.searchParams.get('neighborhood');
    limit = parseInt(url.searchParams.get('limit'));

    if(start_date == null){
        start_date = "2014-08-14T00:00:00";
    }else {
       start_date += "T00:00:00";
    }

    if(end_date == null){
        end_date = "2020-11-26T24:59:59";
    }else {
        end_date += "T24:59:59";
    }

    if(neighborhoods == null){
        neighborhoods = "SELECT distinct neighborhood_number FROM Incidents";
    }
    
    if(codes == null){
        codes = "SELECT distinct code FROM Incidents";
    }

    if(grids == null){
        grids = "SELECT distinct police_grid FROM Incidents";
    }

   if(Number.isNaN(limit)){
       limit = 1000;
    }

    let query = "SELECT * FROM Incidents WHERE date_time > '"+start_date+"' AND date_time < '"+end_date+"' AND neighborhood_number in ("+neighborhoods+") AND code IN ("+codes+") AND police_grid IN ("+grids+") GROUP BY date_time LIMIT "+limit;

    Promise.all([databaseSelect(query)]).then((values)=>{
        let split;
        let mappedResults = [];
        let value = values[0];
        for(let i = 0; i < value.length; i++){
            split = String(value[i].date_time).split("T");
            let mappedRes = {
                case_number: value[i].case_number,
                date: split[0],
                time: split[1],
                code: value[i].case_number,
                incident: value[i].incident,
                police_grid: value[i].police_grid,
                neighborhood_number: value[i].neighborhood_number,
                block: value[i].block
            };
            mappedResults.push(mappedRes);
        }

        res.status(200).type('json').send(mappedResults);
    }).catch((err) => {
        console.error(error.message);
    });
});

// REST API: PUT /new-incident
// Respond with 'success' or 'error'
app.put('/new-incident', (req, res) => {
    let url = new URL(req.protocol + '://' + req.get('host') + req.originalUrl);

    res.status(200).type('txt').send('success');
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