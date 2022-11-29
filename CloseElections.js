//Width and height
var w = 800;
var h = 500;

//Define projection, using the Albers USA projection
var projection = d3.geoAlbersUsa().translate([w/2, h/2]).scale([1000]);;

//Define path generator, using the Albers USA projection
var path = d3.geoPath()
          .projection(projection);

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
var start = 0;
var end = districts.length;

// initializes start to be the first index in districts of the year year1, and end to the stopping point for that year
function initializeStartEnd() {
    start = 0 + 435 * ((year1 - 2010)/2);
    end = districts.length - 435 * ((2020 - year1)/2);
    console.log(start);
    console.log(end);
}

// returns a color used to fill a district based on if a democrat, republican, or independent won in a district
function color(data) {
    if (data.properties.STATE == "DC") { // fill Washington DC blue
        return "blue";
    }
    // go through districts[] based on the starting and ending index of year1 (for example looks through all the results of 2012 if year1 is 2012)
    for(var i = start; i < end; i++) { 
        if (data.properties.STATE == districts[i].state && data.properties.CD == districts[i].district && districts[i].year == year1) {
            if(close_only) { // only fill in districts in which the top two candidates were within 5% of the total vote
                if (((districts[i].c1v / districts[i].total) - (districts[i].c2v / districts[i].total)) <= 0.05 ) {
                    if (districts[i].c1p == "DEMOCRAT") { // if the winning candidate in the district was a democrat
                        return "blue";
                    }
                    else if (districts[i].c1p == "REPUBLICAN") { // if the winning candidate in the district was a republican
                        return "red";
                    }
                    else {
                        return "yellow"; // if the winning candidate in the district wasn't democrat or republican
                    }
                }
                return "white"; // fill the district in white if the election isn't close
            }
            else { // normal display
                if (districts[i].c1p == "DEMOCRAT") { // if the winning candidate in the district was a democrat
                    return "blue";
                }
                else if (districts[i].c1p == "REPUBLICAN") { // if the winning candidate in the district was a republican
                    return "red";
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
    var output = data.properties.STATE + " " + data.properties.CD + "<br/>";
    //console.log(districts);
    for(var i = start; i < end; i++) { 
        if (data.properties.STATE == districts[i].state && data.properties.CD == districts[i].district && districts[i].year == year1) {
            output += districts[i].c1;
            if (districts[i].c1p == "DEMOCRAT") {
                output += "(D): ";
            }
            else if (districts[i].c1p == "REPUBLICAN") {
                output += "(R): ";
            }
            else {
                output += "(I): ";
            }
            output += districts[i].c1v + "<br/>";
            if (districts[i].c2 != "WRITEIN" && districts[i].c2 != "OTHER") {
                output += districts[i].c2;
                if (districts[i].c2p == "DEMOCRAT") {
                    output += "(D): ";
                }
                else if (districts[i].c2p == "REPUBLICAN") {
                    output += "(R): ";
                }
                else {
                    output += "(I): ";
                }
                output += districts[i].c2v + "<br/>";
            }
            output += "Vote Difference: ";
            output += (((districts[i].c1v / districts[i].total) - (districts[i].c2v / districts[i].total)) * 100).toFixed(2);
            output += "%<br/>";
            output += "Total Votes: " + districts[i].total;
        }
    }
    return output;
}

// determine text on button
function ButtonName () {
    var b = "Highlight Close Districts";
    if (close_only) {
        b = "Show All Districts";
    }
    d3.select("#close").text(b);
}

// initalize districts[] to hold the data from the csv
d3.csv("HouseElectionResults.csv",type).then(function(data) {
    push_district(); // adds the last district data to districts[]
    console.log(data);
});

function ChangeDisplay() {
    // change button name
    ButtonName();
    
    // remove svg before redrawing map
    d3.select("#display").select("svg").remove();
    
    // Create svg
    var svg = d3.select("#display")
        .append("svg")
        //.attr("class", "force-scale")
        .attr("width", w)
        .attr("height", h); 
    
    // Define Tooltip here
    var div = d3.select("#display").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);
    
    d3.json("USDistricts.json").then(function(json) {
        initializeStartEnd(); 
        console.log(districts[start]); // first district in year1
        console.log(districts[end-1]); // last district in year1
        console.log(current_district);
        console.log(current_state);
        console.log(districts);
        svg.selectAll("path")
           .data(json.features)
           .enter()
           .append("path")
           .attr("stroke", "black")
           .attr("fill", function(i) { /*console.log(i);*/ return color(i); })
           .attr("d", path)
        .on("mouseover", function(info) { 
            div.transition()
                .duration(200)
                .style("opacity", .9);
            //console.log(TooltipOutput(info));
            div.html(TooltipOutput(info))
                .style("left", (d3.event.pageX - 380) + "px")
                .style("top", (d3.event.pageY - 130) + "px");
        })
        .on("mouseout", function(d){
            div.transition()
                .duration(300)
                .style("opacity", 0);
        });
        //console.log(close_only);
        close_only = !close_only;
    });
}

ChangeDisplay(); // initial display