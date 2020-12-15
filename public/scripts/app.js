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
            incidentResults: []
        },
        methods: {
            sendInput: function(){
                getLatLong(this.input);
            },
        }
    });

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

function addNeighborhoodPopups(){
    for(let i = 1; i <= 17; i++){
        L.marker([neighborhood_markers[i-1].location[0], neighborhood_markers[i-1].location[1]]).addTo(map).bindPopup(neighborhoodCounts[i].name+' Crime Count: '+neighborhoodCounts[i].count).openPopup();
    }
}

function getNeighborhoods() {
    let url = 'http://localhost:8000/neighborhoods';
    neighborhoodCounts = {};
    return getJSON(url).then((result) => {
        for(let i = 0; i < result.length; i++){
            neighborhoodCounts[result[i].neighborhood_number] = {name: result[i].neighborhood_name, count: 0};
        }
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
    });
}

function getIncidents(){
    let url = 'http://localhost:8000/incidents?';
    return getJSON(url).then((result) => {
        app.incidentResults = [];
        for(let i = result.length-1; i >= 0; i--){ //adding most recent incidents first
            app.incidentResults.push(result[i]);
            neighborhoodCounts[result[i].neighborhood_number].count++; //increment crime count for neighborhood
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
    if(data == null){

    }
    let latLong = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    map.setZoom(16);
    map.flyTo(latLong);

}

function getLatLong(input){
    /*
    let splitInput = [];
    if(input.includes(",")){
        splitInput = input.split(",");
        if(splitInput.length == 2 && !isNaN(parseFloat(splitInput[0])) && !isNaN(parseFloat(splitInput[1]))){
            //valid
            let latLong = splitInput.map(element => {
                //return parseFloat(element);
            });
            //return latLong;
        }
        
    }else{
        splitInput[0] = input;

    }
    //address
    */
    let request = {
        url: "https://nominatim.openstreetmap.org/search/" + input + "?format=json&addressdetails=1",
        dataType: "json",
        success: panToLocation
    };
    $.ajax(request);

}   

