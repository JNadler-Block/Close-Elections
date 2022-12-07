//Width and height
var w = 800;
var h = 500;
//Initialize svg
var svg = d3.select("#display")
.append("svg")
//.attr("class", "force-scale")
.attr("width", w)
.attr("height", h);
// Define Tooltip here
var div = d3.select("#display").append("div")
.attr("class", "tooltip")
.style("opacity", 0);
//Define projection, using the Albers USA projection
var projection = d3.geoAlbersUsa().translate([w/2, h/2]).scale([1000]);

//var projection = d3.geoMercator().rotate([0, 0, 0]);
//Define path generator, using the Albers USA projection
var path = d3.geoPath()
    .projection(projection);

var democrat_wins = 0; // How many house seats democrats won in the current year
var republican_wins = 0; // How many house seats republicans won in the current year
var independent_wins = 0; // How many house seats independents won in the current year
var democrat_close = 0; // How many close house seats democrats won in the current year
var republican_close = 0; // How many close house seats republicans won in the current year
var closest_election; // Holds data for the closest election of the given year;
var current_year = 2008;
var current_district = 0;
var current_state = "";
var winner = "";
var winner_votes = 0;
var winner_party = "";
var loser = "";
var loser_votes = 0;
var loser_party = "";
var total_votes = 0;
var districts = [];
var close_districts = [];

function push_district() {
    districts.push({
        year: current_year,
        district: current_district,
        state: current_state,
        c1: winner, // winning candidate name
        c1v: winner_votes,
        c1p: winner_party,
        c2: loser, // loser candidate name (loser with the highest votes)
        c2v: loser_votes,
        c2p: loser_party,
        total: total_votes
    });
}

function type(d, _, columns) {
    if (d.district != current_district || d.state != current_state) { // if the data is parsing a new district
        if (current_year != 2008) { // makes sure it doesn't push the intial variables to districts[]
            push_district(); // everytime the data gets to a new district, add the data for the past district to districts[]
        }
    // intialize the variables again, setting the winning candidate (initially) to the first candidate
    current_year = +d.year;
    current_district = +d.district;
    current_state = d.state;
    winner = d.candidate;
    winner_votes = +d.candidatevotes;
    winner_party = d.party;
    loser = "";
    loser_votes = 0;
    loser_party = "";
    total_votes = +d.totalvotes;
    }
    else {
        // if the current candidate has more votes then the current winning candidate,
        // set the loser to the current winning candidate, and the winner to the current candidate
        if (+d.candidatevotes > winner_votes) {
            loser = winner;
            loser_votes = winner_votes;
            loser_party = winner_party;
            winner = d.candidate;
            winner_votes = +d.candidatevotes;
            winner_party = d.party;
        }
    // if the current candidate has more votes than the current losing candidate,
    // set the loser to the current candidate
        else if (+d.candidatevotes > loser_votes) {
            loser = d.candidate;
            loser_votes = +d.candidatevotes;
            loser_party = d.party;
        }
    }
    for (var i = 1, n = columns.length, c; i < n; ++i) {
        if (columns[i] == "candidate" || columns[i] == "fusion_ticket" || columns[i] == "party" || columns[i] == "state" || columns[i] == "state_po" || columns[i] == "writein") {
            d[c = columns[i]] = d[c];
        }
        else {
            d[c = columns[i]] = +d[c];
        }
    }
    return d;
}

var close_only = false; // determines whether or not to only fill in close districts
var year1 = 2010;
var previous_year = year1;
var start = 0;
var end = districts.length;
var paths;

// initializes start to be the first index in districts of the year year1, and end to the stopping point for that year
function initializeStartEnd() {
    start = 0 + 435 * ((year1 - 2010)/2);
    end = districts.length - 435 * ((2020 - year1)/2);
    //console.log(start);
    //console.log(end);
}
// 
returns a color used to fill a district based on if a democrat, republican, or independent won in a district
function color(data) {
    if (data.properties.STATE == "DC") { // fill Washington DC blue
        return "blue";
    }
    // go through districts[] based on the starting and ending index of year1 (for example looks through all the results of 2012 if year1 is 2012)
    for(var i = start; i < end; i++) {
    if (data.properties.STATE == districts[i].state && data.properties.CD == districts[i].district && districts[i].year == year1) {
    var margin = (districts[i].c1v / districts[i].total) - (districts[i].c2v / districts[i].total);
    var closest_margin = (closest_election.c1v / closest_election.total) - (closest_election.c2v / closest_election.total);
    if (margin < closest_margin) { // if current election is closer then the closest election, update closest_election
    closest_election = districts[i];
    }
    // Increment results for the current year
    if (districts[i].c1p == "DEMOCRAT" || districts[i].c1p == "DEMOCRATIC-FARMER-LABOR") {
    democrat_wins++;
    if (margin <= 0.05 ) {
    democrat_close++; // a democrat won a close election
    }
    }
    else if (districts[i].c1p == "REPUBLICAN") {
    republican_wins++;
    if (margin <= 0.05 ) {
    republican_close++; // a republican won a close election
    }
    }
    else {
    idependent_wins++;
    }
    if(close_only) { // only fill in districts in which the top two candidates were within 5% of the total vote
    if (margin <= 0.05 ) {
    close_districts.push(data);
    if (districts[i].c1p == "DEMOCRAT" || districts[i].c1p == "DEMOCRATIC-FARMER-LABOR") { // if the winning candidate in the district was a democrat
    return "#8888ff";
    }
    else if (districts[i].c1p == "REPUBLICAN") { // if the winning candidate in the district was a republican
    return "#ff8888";
    }
    else {
    return "yellow"; // if the winning candidate in the district wasn't democrat or republican
    }
    }
    return "white"; // fill the district in white if the election isn't close
    }
    else { // normal display
    // ["#eff3ff","#bdd7e7","#6baed6","#3182bd","#08519c"]
    if (districts[i].c1p == "DEMOCRAT" || districts[i].c1p == "DEMOCRATIC-FARMER-LABOR") { // if the winning candidate in the district was a democrat
    if (margin <= 0.05) {
    return "#8888ff";
    }
    else if (margin <= 0.1) {
    return "#6666ff";
    }
    else if (margin <= 0.2) {
    return "#4444ff";
    }
    else if (margin <= 0.4) {
    return "#2222ff";
    }
    else {
    return "#0000ff";
    }
    }
    // ["#fee5d9","#fcae91","#fb6a4a","#de2d26","#a50f15"]
    else if (districts[i].c1p == "REPUBLICAN") { // if the winning candidate in the district was a republican
    if (margin <= 0.05) {
    return "#ff8888";
    }
    else if (margin <= 0.2) {
    return "#ff6666";
    }
    else if (margin <= 0.4) {
    return "#ff4444";
    }
    else if (margin <= 0.6) {
    return "#ff2222";
    }
    else {
    return "#ff0000";
    }
    }
    else {
    return "yellow"; // if the winning candidate in the district wasn't democrat or republican
    }
    }
    }
    }
    return "transparent";
}

function TooltipOutput(data) {
var output = data.properties.STATE + " District " + data.properties.CD + "<br/>";
//console.log(districts);
for(var i = start; i < end; i++) {
if (data.properties.STATE == districts[i].state && data.properties.CD == districts[i].district && districts[i].year == year1) {
/*output += districts[i].c1.toLowerCase();
if (districts[i].c1p == "DEMOCRAT") {
output += "(D): ";
}
else if (districts[i].c1p == "REPUBLICAN") {
output += "(R): ";
}
else {
output += "(I): ";
}*/
//output += districts[i].c1v + "<br/>";
if (districts[i].c1p == "DEMOCRAT" || districts[i].c1p == "DEMOCRATIC-FARMER-LABOR") {
output += "Democrat: ";
}
else if (districts[i].c1p == "REPUBLICAN") {
output += "Republican: ";
}
else {
output += "Independent: ";
}
output += ((districts[i].c1v / districts[i].total) * 100).toFixed(2);
output += "%<br/>";
if (districts[i].c2 != "WRITEIN" && districts[i].c2 != "OTHER") {
/*output += districts[i].c2.toLowerCase();
if (districts[i].c2p == "DEMOCRAT") {
output += "(D): ";
}
else if (districts[i].c2p == "REPUBLICAN") {
output += "(R): ";
}
else {
output += "(I): ";
}*/
if (districts[i].c2p == "DEMOCRAT" || districts[i].c2p == "DEMOCRATIC-FARMER-LABOR") {
output += "Democrat: ";
}
else if (districts[i].c2p == "REPUBLICAN") {
output += "Republican: ";
}
else {
output += "Independent: ";
}
//output += districts[i].c2v + "<br/>";
output += ((districts[i].c2v / districts[i].total) * 100).toFixed(2);
output += "%<br/>";
output += "Vote Difference: ";
output += (((districts[i].c1v / districts[i].total) - (districts[i].c2v / districts[i].total)) * 100).toFixed(2);
output += "%<br/>";
}
//output += "Total Votes: " + districts[i].total;
}
}
return output;
}
// determine text on button
function ButtonName () {
var b = "Show All Districts";
if (!close_only) {
b = "Highlight Close Districts";
}
d3.select("#close").text(b);
}
// initalize districts[] to hold the data from the csv
d3.csv("HouseElectionResults.csv",type).then(function(data) {
push_district(); // adds the last district data to districts[]
console.log(data);
});
function drawLegend() {
d3.select("#display").selectAll("#legend").remove()
var domain
var range
console.log("Hello")
if (close_only)
{
console.log("closed")
domain = ["D within 5%","D within 10%","D within 20%","D within 40%",5,6]
range = ["rgb(136, 136, 255)","rgb(102, 102, 255)","rgb(68, 68, 255)","rgb(34, 34, 255)","rgb(0, 0, 255)","rgb(255, 136, 136)"]
}
else
{
console.log("regular")
domain = ["D within 5%","D within 10%","D within 20%","D within 40%","D over 40%","R within 5%","R within 10%","R within 20%","R within 40%","R over 40%"]
range = ["rgb(136, 136, 255)","rgb(102, 102, 255)","rgb(68, 68, 255)","rgb(34, 34, 255)","rgb(0, 0, 255)","rgb(255, 136, 136)","rgb(255, 102, 102)","rgb(255, 68, 68)","rgb(255, 34, 34)","rgb(255, 0, 0)"]
}
var sequentialScale = d3.scaleOrdinal()
.domain(domain)
.range(range);
var legend = d3.select("#display").append("svg")
.attr("id","legend")
.attr("width", 200)
legend.append("g")
.attr("class", "legendSequential")
.attr("transform", "translate(20,20)")
.attr('width', 500)
.attr('height', 100)
var legendSequential = d3.legendColor()
.shapeWidth(30)
.cells([1,2,3,4,5,6,7,8,9,10])
.title("Vote Margin")
.scale(sequentialScale)
legend.select(".legendSequential")
.call(legendSequential);
}
function DrawMap() {
// Reset results because display is being drawn
/*d = 0;
r = 0;
i = 0;
dc = 0;
rc = 0;*/
//democrat_wins = 0;
//republican_wins = 0;
var json_name = "USDistricts2012.json";
if (year1 == 2010) {
json_name = "USDistricts2010.json";
}
d3.json(json_name).then(function(json) {
initializeStartEnd();
console.log(districts[start]); // first district in year1
console.log(districts[end-1]); // last district in year1
console.log(current_district);
console.log(current_state);
console.log(districts);
closest_election = districts[start];
paths = svg.selectAll("path")
.data(json.features)
.enter()
.append("path")
.attr("stroke", "black")
.attr("stroke-width", "0.4px")
.attr("fill-rule", "inherit")
.attr("fill", function(i) { /*console.log(i);*/ return color(i); })
.attr("d", path)
.on("mouseover", function(info) {
//style("stroke", "white");
if (!close_only || close_districts.includes(info)) {
div.transition()
.duration(200)
.style("opacity", .9);
//console.log(TooltipOutput(info));
div.html(TooltipOutput(info))
.style("left", (d3.event.pageX - 380) + "px")
.style("top", (d3.event.pageY - 130) + "px");
}
})
.on("mouseout", function(d){
div.transition()
.duration(300)
.style("opacity", 0);
});
//var f = 0;
for (var i = start; i < end; i++) {
if (districts[i].state == "New York" && districts[i].c1p == "DEMOCRAT") {
console.log(districts[i].district);
//f++;
}
}
//console.log(f);
side_tooltip();
});
}
function ChangeDisplay(j) {
// change button name
//ButtonName();
if (j) { // if the button was clicked
close_only = !close_only;
paths.style("fill", function(info) { return color(info); }); // recolor map only filling in close districts
drawLegend()
}
else {
// remove svg before redrawing map
d3.select("#display").selectAll("svg").remove();
// Create svg
svg = d3.select("#display")
.append("svg")
.attr("width", w)
.attr("height", h);
DrawMap();
drawLegend();
var zoom = d3.zoom()
.scaleExtent([1, 8])
.on('zoom', function() {
svg.selectAll('path')
.attr('transform', d3.event.transform);
});
svg.call(zoom);
//side_tooltip();
}
// change button name
ButtonName();
}
function side_tooltip() {
var party = "An Independent";
if (closest_election.c1p == "DEMOCRAT" || closest_election.c1p == "DEMOCRATIC-FARMER-LABOR") {
party = "Democrats";
}
else if (closest_election.c1p == "REPUBLICAN") {
party = "Republicans";
}
var vote_margin = (((closest_election.c1v / closest_election.total) - (closest_election.c2v / closest_election.total)) * 100).toFixed(3);
//(((districts[i].c1v / districts[i].total) - (districts[i].c2v / districts[i].total)) * 100).toFixed(2);
d3.select("#static-title").html("Close House Elections of " + year1);
d3.select("#static-data").html("<br/><span style='property:red'>Democrats</span> won " + democrat_wins + " seats.<br/>Republicans won " + republican_wins +
" seats.<br/><br/>Out of " + (republican_close + democrat_close) + " close elections:<br/> Democrats won " + democrat_close + " close elections.<br/>Republicans won " + republican_close + " close elections.<br/><br/><br/>Closest House Election of " + year1 + ":<br/>" + closest_election.state + " District " + closest_election.district + "<br/>" + party + " won by " + vote_margin + "% of the vote.");
}
function ChangeYear() { // year1 is year
initializeStartEnd();
close_districts = [];
democrat_wins = 0;
republican_wins = 0;
democrat_close = 0;
republican_close = 0;
closest_election = districts[start];
if ((previous_year == 2010 && year1 != 2010) || (previous_year != 2010 && year1 == 2010)) { // if you should redraw map
ChangeDisplay(false);
}
else { // just refill the colors of districts
// Reset results for year because year changed
paths.style("fill", function(info) { return color(info); });
side_tooltip();
// Fill out tooltip with statistics for the year
//side_tooltip();
}
// Fill out tooltip with statistics for the year
// side_tooltip();
}
ChangeDisplay(false); // initial display