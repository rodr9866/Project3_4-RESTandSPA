let app;
let map;
let neighborhoodCounts = {};
let neighborhood_markers = 
[
    {location: [44.942068, -93.020521], marker: null},
    {location: [44.977413, -93.025156], marker: null},
    {location: [44.931244, -93.079578], marker: null},
    {location: [44.956192, -93.060189], marker: null},
    {location: [44.978883, -93.068163], marker: null},
    {location: [44.975766, -93.113887], marker: null},
    {location: [44.959639, -93.121271], marker: null},
    {location: [44.947700, -93.128505], marker: null},
    {location: [44.930276, -93.119911], marker: null},
    {location: [44.982752, -93.147910], marker: null},
    {location: [44.963631, -93.167548], marker: null},
    {location: [44.973971, -93.197965], marker: null},
    {location: [44.949043, -93.178261], marker: null},
    {location: [44.934848, -93.176736], marker: null},
    {location: [44.913106, -93.170779], marker: null},
    {location: [44.937705, -93.136997], marker: null},
    {location: [44.949203, -93.093739], marker: null}
];

function init() {
    let crime_url = 'http://localhost:8000';

    app = new Vue({
        el: '#app',
        data: {
            map: {
                center: {
                    lat: 44.955139,
                    lng: -93.102222,
                    address: ""
                },
                zoom: 12,
                bounds: {
                    nw: {lat: 45.008206, lng: -93.217977},
                    se: {lat: 44.883658, lng: -92.993787}
                }
            },
            input: "",
            codeResults: {},
            neighborhoodResults: {},
            incidentResults: [],
            incidentTypes: [],
            incident_checkboxes: [],
            neighborhood_checkboxes: [],
            startDate: "",
            endDate: "",
            startTime: "",
            endTime: "",
            limit: null
        },
        methods: {
            sendInput: function(){
                getLatLong(this.input);
            }
        }
    });

    getIncidentTypes();
    getCodes();
    getNeighborhoods().then(() =>{
        getIncidents().then(() => {
            map = L.map('leafletmap').setView([app.map.center.lat, app.map.center.lng], app.map.zoom);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                minZoom: 11,
                maxZoom: 18
            }).addTo(map);
        
            map.setMaxBounds([[44.883658, -93.217977], [45.008206, -92.993787]]);
        }).then(() => {
            addNeighborhoodPopups();
        
            let district_boundary = new L.geoJson();
            district_boundary.addTo(map);
        
            getJSON('data/StPaulDistrictCouncil.geojson').then((result) => {
                // St. Paul GeoJSON
                $(result.features).each(function(key, value) {
                    district_boundary.addData(value);
                });
            }).catch((error) => {
                console.log('Error:', error);
            });
        });
    });
}

function applyFilters() {
    params = "";
    codes = [];
    if(app.incident_checkboxes.length > 0) {
        if(app.incident_checkboxes.includes("Murder")) {
            codes.push(110);
            codes.push(120);
        }
        if(app.incident_checkboxes.includes("Rape")) {
            codes.push(210);
            codes.push(220);
        }
        if(app.incident_checkboxes.includes("Robbery")) {
            let i;
            for(i = 300; i <= 374; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Aggravated Assault")) {
            let i;
            for(i = 400; i <= 453; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Burglary")) {
            let i;
            for(i = 500; i <= 566; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Theft")) {
            let i;
            for(i = 600; i <= 693; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Motor Vehicle Theft")) {
            let i;
            for(i = 700; i <= 722; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Assault")) {
            codes.push(810);
            codes.push(861);
            codes.push(862);
            codes.push(863);
        }
        if(app.incident_checkboxes.includes("Arson")) {
            let i;
            for(i = 900; i <= 982; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Property Damage")) {
            let i;
            for(i = 1400; i <= 1436; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Narcotics")) {
            let i;
            for(i = 1800; i <= 1885; i++) {
                codes.push(i);
            }
        }
        if(app.incident_checkboxes.includes("Weapons")) {
            codes.push(2619);
        }
        if(app.incident_checkboxes.includes("Narcotics")) {
            codes.push(9954);
        }
        if(app.incident_checkboxes.includes("Narcotics")) {
            codes.push(9959);
        }

        params = params + "code=" + codes.join() + "&";
    }

    if(app.neighborhood_checkboxes.length > 0) {
        params = params + "neighborhood=" + app.neighborhood_checkboxes.join() + "&";
    }

    start_datetime = "";
    end_datetime = "";

    if(app.startDate != "") {
        start_datetime = app.startDate;
        if(app.startTime != "") {
            start_datetime = start_datetime + "T" + app.startTime + ":00";
        }
        else {
            start_datetime += "T00:00:00";
        }
        params = params + "start_date=" + start_datetime + "&";
    }
    else if(app.startTime != "") {
        start_datetime = "2014-08-14T" + app.startTime + ":00";
        params = params + "start_date=" + start_datetime + "&";
    }

    if(app.endDate != "") {
        end_datetime = app.endDate;
        if(endTime != "") {
            end_datetime = end_datetime + "T" + app.endTime + ":00";
        }
        else {
            end_datetime += "T24:59:59";
        }
        params = params + "end_date=" + end_datetime + "&";
    }
    else if(app.endTime != "") {
        end_datetime = "2020-11-26T" + app.endTime + ":00";
        params = params + "end_date=" + end_datetime + "&";
    }

    if(app.limit != null) {
        params = params + "limit=" + app.limit;
    }

    console.log(params);
    if(params != "") {
        getIncidents(params);
    }

}

function getIncidentTypes() {
    app.incidentTypes.push("Murder");
    app.incidentTypes.push("Rape");
    app.incidentTypes.push("Robbery");
    app.incidentTypes.push("Aggravated Assault");
    app.incidentTypes.push("Burglary");
    app.incidentTypes.push("Theft");
    app.incidentTypes.push("Motor Vehicle Theft");
    app.incidentTypes.push("Assault");
    app.incidentTypes.push("Arson");
    app.incidentTypes.push("Property Damage");
    app.incidentTypes.push("Narcotics");
    app.incidentTypes.push("Weapons");
    app.incidentTypes.push("Proactive Police Event");
    app.incidentTypes.push("Community Engagement Event");
    app.incidentTypes.push("Other");

    console.log(app.incidentTypes);
}

function addNeighborhoodPopups(){
    let maxLon = app.$data.map.bounds.se.lon
    let minLon = app.$data.map.bounds.nw.lon
    let maxLat = app.$data.map.bounds.nw.lat;
    let minLat = app.$data.map.bounds.se.lat;

    for(let i = 1; i <= 17; i++){
        let neighborhoodLat = neighborhood_markers[i-1].location[0];
        let neighborhoodLon = neighborhood_markers[i-1].location[1];

        if((neighborhoodLat < minLat || neighborhoodLat > maxLat) || (neighborhoodLon < minLon || neighborhoodLon > maxLon)){
            neighborhood_markers[i-1].marker = null;
        }else { //only add popup if in bounds of map
            neighborhood_markers[i-1].marker = L.marker([neighborhood_markers[i-1].location[0], neighborhood_markers[i-1].location[1]]).addTo(map).bindPopup(neighborhoodCounts[i].name+' Crime Count: '+neighborhoodCounts[i].count).openPopup();
        }
    }
}

function getNeighborhoods() {
    //could add to {} and put onMap: T/F then in getIncidents if neighborhoodCounts[neighborhoodNum].onMap != T => don't push!
    let url = 'http://localhost:8000/neighborhoods';
    neighborhoodCounts = {};
    return getJSON(url).then((result) => {
        for(let i = 0; i < result.length; i++){
            neighborhoodCounts[result[i].neighborhood_number] = {name: result[i].neighborhood_name, count: 0, number: result[i].neighborhood_number, onMap: false};
        }
        console.log(neighborhoodCounts);
    });
}

function getCodes(){
    let url = 'http://localhost:8000/codes';
    app.codeResults = [];
    return getJSON(url).then((result) => {
        for(let i = 0; i < result.length; i++){
            let code = result[i].code;
            let arr = [];
            arr.push(result[i].incident_type);
            if((code >= 1800 && code <= 9959) || (code == 614)){
                arr.push(false); //violent crime = false
                arr.push(true); //other crime = true
            }else if((code >= 110 && code <= 220) || (code >= 400 && code <= 453) || (code >= 810 && code <= 982)){
                arr.push(true); //violent crime = true
                arr.push(false); //other crime = false
            }
            app.codeResults[code] = arr;
        }
        console.log(app.codeResults);
    });
}

function getIncidents(params){
    let url = 'http://localhost:8000/incidents?';
    if(params != null) {
        url = url + params;
    }

    //only show crimes that occured in locations visible on map
    let maxLon = app.$data.map.bounds.se.lon
    let minLon = app.$data.map.bounds.nw.lon
    let maxLat = app.$data.map.bounds.nw.lat;
    let minLat = app.$data.map.bounds.se.lat;

    for(let i = 1; i <= 17; i++){
        let neighborhoodLat = neighborhood_markers[i-1].location[0];
        let neighborhoodLon = neighborhood_markers[i-1].location[1];

        if((neighborhoodLat < minLat || neighborhoodLat > maxLat) || (neighborhoodLon < minLon || neighborhoodLon > maxLon)){
            neighborhood_markers[i-1].marker = null;
            neighborhoodCounts[i].onMap = false;
        }else { 
            neighborhoodCounts[i].onMap = true;
        }
    }

    return getJSON(url).then((result) => {
        let nw = [app.$data.map.bounds.nw.lat, app.$data.map.bounds.nw.lng];
        let se = [app.$data.map.bounds.se.lat, app.$data.map.bounds.se.lng];
        app.incidentResults = [];

        for(let i = 0; i < result.length; i++){ //adding most recent incidents first
            if(neighborhoodCounts[result[i].neighborhood_number].onMap){
                app.incidentResults.push(result[i]);
                neighborhoodCounts[result[i].neighborhood_number].count++; //increment crime count for neighborhood
            }
        }
    });
}

function getJSON(url) {
    return new Promise((resolve, reject) => {
        $.ajax({
            dataType: "json",
            url: url,
            success: function(data) {
                resolve(data);
            },
            error: function(status, message) {
                reject({status: status.status, message: status.statusText});
            }
        });
    });
}
//MAYBE DELETE
function panToLocation(data){
    console.log(data);
    if(data != null){
        let latLong = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        map.setZoom(16);
        map.flyTo(latLong);
        app.input = latLong.toString();
    }
}

function getLatLong(input){
    let splitInput = [];
    if(input.includes(",")){
        splitInput = input.split(",");
        if(splitInput.length == 2 && !isNaN(parseFloat(splitInput[0])) && !isNaN(parseFloat(splitInput[1]))){
            //valid
            let latLong = splitInput.map(element => {
                return parseFloat(element);
            });

            //clamp
            map.setZoom(16);
            map.flyTo(latLong);
        }
        
    }else{
        //address was inputted
        splitInput[0] = input;
        let request = {
            url: "https://nominatim.openstreetmap.org/search?q=" + input + "&format=json&addressdetails=1",
            dataType: "json",
            success: panToLocation
        };
        $.ajax(request);
    }
}   
