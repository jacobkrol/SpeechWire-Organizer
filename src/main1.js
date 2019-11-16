window.onload = function() {
    main();
}

function call(url) {
    //create promise for async call
    return new Promise((resolve, reject) => {
        //perform async ajax request
        $.get(url, (data, status) => {
            //send data if success, or reject if error
            if(status==="success") {
                resolve(data);
            } else {
                reject(Error("GET request failed"));
            }
        });
    });
};

function getEventVals(tournID) {

    return new Promise((resolve, reject) => {
        //define url and regex for ajax request
        const url = "https://www.speechwire.com/c-postings-schem.php?tournid="+tournID,
              eventValsRegex = /(?<=<option value=['"])\d+(?=['"])/g;

        //make call to tournament schem home page
        call(url)
            .then((page) => {
                resolve(page.match(eventValsRegex));
            })
            .catch((err) => {
                console.log(err);
            });
    });

}

function getEventNames(tournID) {

    return new Promise((resolve, reject) => {
        //define url and regex for ajax request
        const url = "https://www.speechwire.com/c-postings-schem.php?tournid="+tournID,
              eventNamesRegex = /(?<=<option value=['"]\d+['"]>)[\w\s]+?(?=<)/g;

        //make call to tournament schem home page
        call(url)
            .then((page) => {
                resolve(page.match(eventNamesRegex));
            })
            .catch((err) => {
                console.log(err);
            });

    });

}

function getSchems(url) {

    return new Promise((resolve, reject) => {
        call(url)
            .then((page) => {

                //pull round 1 for competitor names, and pull event title
                let reg1 = /<table class=['"]publicschematic['"].+?>.+?<\/table>/,
            		round1 = page.match(reg1)[0];
            	let reg2 = /(?<=<td class="publicspeechschematic">(?!\d))[\w+\s*'*\-*\.*]{2,}?(?=<\/td>)/g,
            		names = round1.match(reg2);
            	let reg3 = /(?<=<p class=("|')pagesubtitle("|')>)(\w|\s)+?(?=<\/p>)/,
            		title = page.match(reg3)[0];

                //send final results in object
                resolve({names:names,title:title});
            })
            .catch((err) => {
                console.log(err);
            });
    });
}

function getFullSchems(url) {

    return new Promise((resolve, reject) => {
        call(url)
            .then((page) => {

                // pull event 'title'
                // the 'time' of the round,
                // all of the 'rounds',
                // and the number of 'sections',
                // initialize empty schematics array,
                // and determine if 'final round' is present
                let title = page.match(/(?<=<p class=['"]pagesubtitle['"]>)[\w\s]+?(?=<\/p>)/)[0],
                    time = page.match(/(\d)+:(\d){2}\s[AP]M/)[0],
                    rounds = page.match(/<table class=['"]publicschematic['"].+?>.+?<\/table>/g),
                    numSections = rounds[0].match(/class=['"]publicspeechschematicsectionname['"]/g).length-1,
                    schems = [],
                    skipFinalRound = rounds[0].match(/class=['"]publicspeechschematicsectionname['"]/g).length !== rounds[rounds.length-1].match(/class=['"]publicspeechschematicsectionname['"]/g).length;

                //organize names for each round, r
                for(let r=0; r<rounds.length; r++) {

                    //set up current round
                    let names = rounds[r].match(/(?<=<td class="publicspeechschematic">(?!\d))([\w+\s*'*\-*\.*]{2,}|\s)?(?=<\/td>)/g); //pull names for current round, r
                        sections = new Array(numSections).fill([]); //initialize empty sections array
                    if(r===rounds.length-1 && skipFinalRound) break; // leave loop if reaching 'final round' posting

                    //collate schematics for current round, r
                    // for(let s=0; s<numSections; ++s) {
                    //     sections[s] = names.filter(n => names.indexOf(n)%numSections===s && n!==' ');
                    // }
                    // schems.push(sections); //push organized round data
                    schems.push(names);
                }
                resolve({title:title,time:time,sections:numSections,rounds:schems}); //send final data object

            })
            .catch((err) => {
                console.log(err);
            });
    });
}

function getCompetitorsByEvents(schems) {
    let competitors = [];
    for(let i=0; i<schems.length; ++i) {
        for(let j=0; j<schems[i].names.length; ++j) {
            const getCompRegex = /(?<=[A-Z]+\d+\s).+/,
                  name = schems[i].names[j].match(getCompRegex)[0];
            if(name) {
                if(name.match(/\sand\s/)) {
                    const name1 = name.match(/(\w+\s*'*\-*\.*)+?(?=\sand)/)[0],
                          name2 = name.match(/(?<=\sand\s)(\w+\s*'*\-*\.*)+/)[0];
                    for(let namei of [name1,name2]) {
                        let exists = false;
                        for(let k=0; k<competitors.length; ++k) {
                            if(competitors[k].name === namei) {
                                competitors[k].events.push(schems[i].title);
                                exists = true;
                            }
                        }
                        if(!exists) {
                            competitors.push({name:namei,events:[schems[i].title]});
                        }
                    }
                } else {
                    let exists = false;
                    for(let k=0; k<competitors.length; ++k) {
                        if(competitors[k].name === name) {
                            competitors[k].events.push(schems[i].title);
                            exists = true;
                        }
                    }
                    if(!exists) {
                        competitors.push({name:name,events:[schems[i].title]});
                    }
                }
            } else {
                throw Error("Error finding competitor name");
            }
        }
    }
    return competitors;
}

function printByEvent(schems) {

    let text = ""; // initialize text variable

    //loop through each event
    for(let i=0; i<schems.length; ++i) {
        //append table header data
        text += "<table class='publicschematic' width='100%'><tr align='center' class='publicschematicheader'><td style='border-bottom: 3px solid #009'>"+schems[i].title+"</td></tr>";
        //for each competitor, append to table
        for(let j=0; j<schems[i].names.length; ++j) {
            text += "<tr align='center'><td class='publicspeechschematic'>"+schems[i].names[j]+"</td></tr>";
        }
        //close out table html element
        text += "</table>"
    }

    //update console and document
    console.log("printed");
    $('#output').html(text);
}

function printByCompetitor(schems) {
    competitors = getCompetitorsByEvents(schems);
    let text = "";
    for(let i=0; i<competitors.length; ++i) {
        text += "<table class='publicschematic' width='100%'><tr align='center' class='publicschematicheader'><td style='border-bottom: 3px solid #009'>"+competitors[i].name+"</td></tr>";
        for(let j=0; j<competitors[i].events.length; ++j) {
            text += "<tr align='center'><td class='publicspeechschematic'>"+competitors[i].events[j]+"</td></tr>";
        }
        text += "</table>"
    }
    console.log("printed");
    $('#output').html(text);
}

function printBySchool(schems) {
    let schools = [];
    // console.log(schems);
    for(let i=0; i<schems.length; ++i) {
        for(let j=0; j<schems[i].names.length; ++j) {
            const getCodeRegex = /[A-Z]+(?=\d+)/,
                  getCompRegex = /(?<=[A-Z]+\d+\s).+/;
            // console.log(i,j,schems[i].names[j],"?");
            let schoolCode = schems[i].names[j].match(getCodeRegex)[0];
            if(schoolCode) {
                let exists = false;
                for(let k=0; k<schools.length; ++k) {
                    if(schools[k].name === schoolCode) {
                        const comp = schems[i].names[j].match(getCompRegex)[0];
                        if(comp.match(/\sand\s/)) {
                            const comp1 = comp.match(/(\w+\s*'*\-*\.*)+?(?=\sand)/)[0],
                                  comp2 = comp.match(/(?<=\sand\s)(\w+\s*'*\-*\.*)+/)[0];
                            // console.log("found duo with",comp1,"and",comp2);
                            for(let compi of [comp1,comp2]) {
                                if(schools[k].competitors.includes(compi)) {
                                    // console.log(compi,"already in school",schoolCode);
                                } else {
                                    // console.log("adding",compi,"to school",schoolCode);
                                    schools[k].competitors.push(compi);
                                }
                            }
                        } else {
                            if(schools[k].competitors.includes(comp)) {
                                // console.log(comp,"already in school",schoolCode);
                            } else {
                                // console.log("adding",comp,"to school",schoolCode);
                                schools[k].competitors.push(comp);
                            }
                        }
                        exists = true;
                    }
                }
                if(!exists) {
                    const comp = schems[i].names[j].match(getCompRegex)[0];
                    // console.log("creating school",schoolCode);
                    // console.log("adding",comp,"to school",schoolCode);
                    schools.push({name:schoolCode,competitors:[comp]});
                }
            } else {
                throw Error("Error finding school code");
            }
        }
    }
    let text = "";
    for(let i=0; i<schools.length; ++i) {
        text += "<table class='publicschematic' width='100%'><tr align='center' class='publicschematicheader'><td style='border-bottom: 3px solid #009'>"+schools[i].name+"</td></tr>";
        for(let j=0; j<schools[i].competitors.length; ++j) {
            text += "<tr align='center'><td class='publicspeechschematic'>"+schools[i].competitors[j]+"</td></tr>";
        }
        text += "</table>"
    }
    console.log("printed");
    $('#output').html(text);
}

function printBySchoolComplex(schems) {

    competitors = getCompetitorsByEvents(schems);

    let schools = [];
    // console.log(schems);
    for(let i=0; i<schems.length; ++i) {
        for(let j=0; j<schems[i].names.length; ++j) {
            const getCodeRegex = /[A-Z]+(?=\d+)/,
                  getCompRegex = /(?<=[A-Z]+\d+\s).+/;
            // console.log(i,j,schems[i].names[j],"?");
            let schoolCode = schems[i].names[j].match(getCodeRegex)[0];
            if(schoolCode) {
                let exists = false;
                for(let k=0; k<schools.length; ++k) {
                    if(schools[k].name === schoolCode) {
                        const comp = schems[i].names[j].match(getCompRegex)[0];
                        if(comp.match(/\sand\s/)) {
                            const comp1 = comp.match(/(\w+\s*'*\-*\.*)+?(?=\sand)/)[0],
                                  comp2 = comp.match(/(?<=\sand\s)(\w+\s*'*\-*\.*)+/)[0];
                            // console.log("found duo with",comp1,"and",comp2);
                            for(let compi of [comp1,comp2]) {
                                if(schools[k].competitors.includes(compi)) {
                                    // console.log(compi,"already in school",schoolCode);
                                } else {
                                    // console.log("adding",compi,"to school",schoolCode);
                                    schools[k].competitors.push(compi);
                                }
                            }
                        } else {
                            if(schools[k].competitors.includes(comp)) {
                                // console.log(comp,"already in school",schoolCode);
                            } else {
                                // console.log("adding",comp,"to school",schoolCode);
                                schools[k].competitors.push(comp);
                            }
                        }
                        exists = true;
                    }
                }
                if(!exists) {
                    const comp = schems[i].names[j].match(getCompRegex)[0];
                    // console.log("creating school",schoolCode);
                    // console.log("adding",comp,"to school",schoolCode);
                    schools.push({name:schoolCode,count:0,competitors:[comp]});
                }
            } else {
                throw Error("Error finding school code");
            }
        }
    }


    for(let i=0; i<schools.length; ++i) {
        let sum = 0;
        for(let j=0; j<schools[i].competitors.length; ++j) {
            for(let k=0; k<competitors.length; ++k) {
                if(competitors[k].name === schools[i].competitors[j]) {
                    schools[i].competitors[j] = {name:schools[i].competitors[j],count:competitors[k].events.length};
                    sum += competitors[k].events.length;
                    break;
                }
            }
        }
        schools[i].count = sum;
    }


    let text = "";
    for(let i=0; i<schools.length; ++i) {
        text += "<table class='publicschematic' width='100%'><tr align='center' class='publicschematicheader'><td style='border-bottom: 3px solid #009'>"+schools[i].name+" ("+schools[i].count+" entries)"+"</td></tr>";
        for(let j=0; j<schools[i].competitors.length; ++j) {
            text += "<tr align='center'><td class='publicspeechschematic'>"+schools[i].competitors[j].name+" ("+schools[i].competitors[j].count+")"+"</td></tr>";
        }
        text += "</table>"
    }
    console.log("printed");
    $('#output').html(text);
}

function rankFinalists(schems) {
    const tournID = window.location.search.slice(4),
          url = "http://www.speechwire.com/r-results.php?tournid="+tournID+"&groupingid=0&round=F";
    $('#output').html('<p>Retreiving additional information. Please be patient...</p>');
    call(url)
        .then((page) => {
            const getPlacesRegex = /(?<=>)([1-6]|Fin\.)(?=<)/g,
                  getCompsRegex = /(?<=compid\=[0-9]+\&seasonid\=[0-9]+['"]>)[a-zA-Z'\s\-]+/g,
                  getEventsRegex = /(?<=<p>(\s)*<strong>)(?<event>.+?)(?=<\/strong>)/g;

            let places = page.match(getPlacesRegex),
                finalists = page.match(getCompsRegex),
                events = page.match(getEventsRegex);
                results = [];

            let currentEvent = -1,
                currentFinalist = -1;
            for(let currentPlace=0; currentPlace<places.length; ++currentPlace) {
                if(places[currentPlace] == 1) currentEvent++;
                currentFinalist++;
                results.push({place:places[currentPlace],name:finalists[currentFinalist],event:events[currentEvent]});
                if(events[currentEvent].match(/duo/i)) {
                    currentFinalist++;
                    results.push({place:places[currentPlace],name:finalists[currentFinalist],event:events[currentEvent]});
                }
            }

            let text = "";
            for(let i=0; i<schems.length; ++i) {
                text += "<table class='publicschematic' width='100%'><tr align='center' class='publicschematicheader'><td style='border-bottom: 3px solid #009'>"+schems[i].title+"</td></tr>";
                for(let j=0; j<schems[i].names.length; ++j) {
                    let final = getPlacement({name:schems[i].names[j],event:schems[i].title},results),
                        entry = final ? schems[i].names[j]+" <b>("+final+")" : schems[i].names[j];
                    console.log("final:",final,"entry:",entry);
                    text += "<tr align='center'><td class='publicspeechschematic'>"+entry+"</td></tr>";
                }
                text += "</table>"
            }
            console.log("printed");
            $('#output').html(text);

        })
        .catch((err) => {
            console.log(err);
        });
}

function matchFlights(events) {
    let text = "";
    for(let name of events) {
        text += "<input id='"+name+"-button"+"' type='button' value='"+name+"' />";
    }
    for(let i=1; i<5; ++i) {
        text += "<div id='flight"+i+"group' style='width:20%;margin:10px 4%'>";
    }
    text += "<br><input id='submit-flights' type='button' value='Submit Flights' />";
    $('#submit-flights').on('click', () => {
        //how to manage drag and drop and send flights
        showCrossSchems(flights);
    });
    $('#output').html(text);
}

function getTimeValue(time) {
    //Expected string input '9:00 AM'

    //pull hour and minute values
    let h = time.match(/\d+(?=:)/)[0],
        m = time.match(/(?<=\d:)\d{2}/)[0];
    m = m ? Number(m) : 0; // set minutes to zero if not marked
    h = time.match(/(pm|PM)/) && h<12 ? Number(h)+12 : Number(h); // add 12 hours for PM

    return h*60+m; // return as count of minutes into day
}

function getFlightSchedule(fullSchems) {

    //initialize arrays with values for first event
    let flights = [[fullSchems[0].title]],
        flightTimes = [getTimeValue(fullSchems[0].time)];

    //loop through events 1 through n for tournament
    for(let i=1; i<fullSchems.length; ++i) {
        //get time value for current event
        let t = getTimeValue(fullSchems[i].time);
        //initialize flag for whether event was pushed
        let matchingFlight = false;
        //loop through determined flight times
        for(let j=0; j<flightTimes.length; ++j) {
            //if within 30 minutes of start time
            if(t<=flightTimes[j]+30 && t>=flightTimes[j]-30) {
                //save to flights array
                flights[j].push(fullSchems[i].title);
                //mark that event was pushed
                matchingFlight = true;
            }
        }
        //if not matching flight was found...
        if(!matchingFlight) {
            //push event to new flight
            flights.push([fullSchems[i].title]);
            //create new flight in times array
            flightTimes.push(getTimeValue(fullSchems[i].time));
        }
    }
    console.log(flightTimes);

    return flights;
}

function eventCrossEntries(schems) {
    const tournID = window.location.search.slice(4);
    $('#output').html('<p>Retreiving additional information. Please be patient...</p>');

    getEventVals(tournID)
        .then((eventVals) => {
            let schemPromises = [];
            for(let i=0; i<eventVals.length; ++i) {
                const url = "https://www.speechwire.com/c-postings-schem.php?groupingid="+eventVals[i]+"&Submit=View+postings&tournid="+tournID;
                schemPromises.push(getFullSchems(url));
            }
            Promise.all(schemPromises).then((fullSchems) => {
                handleCrossEntries(fullSchems,schems);
            });
        })
        .catch((err) => {
            console.log(err);
        })
}

function getCrossEntryText(flights,title,competitors,name) {
    //loop through competitors to find match
    for(let i=0; i<competitors.length; ++i) {
        //if this competitors is the desired
        if(competitors[i].name === name) {
            //loop through flights to find this event
            for(let f=0; f<flights.length; ++f) {
                //loop through events in this flight
                for(let e=0; e<flights[f].length; ++e) {
                    //if current event is this event
                    if(flights[f][e] === title) {
                        //initialize counter
                        let cross = 0;
                        //loop through current flight events
                        for(let e2=0; e2<flights[f].length; ++e2) {
                            //skip same event
                            if(flights[f][e2] === title) continue;
                            //add to count if cross entered
                            cross += competitors[i].events.includes(flights[f][e2]) ? 1 : 0;
                        }

                        //convert cross count to text
                        switch(cross) {
                            case 0:
                                return '';
                                break;
                            case 1:
                                return ' (DE)';
                                break;
                            case 2:
                                return ' (TE)';
                                break;
                            case 3:
                                return ' (QE)';
                                break;
                            default:
                                return ' ('+cross+'E)';
                                break;
                        }
                    }
                }
            }
        }
    }
}

function handleCrossEntries(fullSchems,schems) {
    //get additional flight and competitor info
    const flights = getFlightSchedule(fullSchems),
          competitors = getCompetitorsByEvents(schems);
    console.log(fullSchems,flights);
    //initialize text to blank
    let text = "";
    //for each event at the tournament...
    for(let e=0; e<fullSchems.length; e++) {
        //append event title
        text += "<p class='pagesubtitle'>"+fullSchems[e].title+"</p>";
        //for each round of event, e...
        for(let r=0; r<fullSchems[e].rounds.length; ++r) {
            let maxwidth = fullSchems[e].sections*200;
            //append header for round
            text += "<table class='publicschematic' style='max-width:"+maxwidth+"px' width='100%'><tr align='center' class='publicschematicheader'><td colspan='"+fullSchems[e].sections+"' style='border-bottom: 3px solid #009'>Round "+(r+1)+"</td></tr>";
            //initialize section marker
            let section = 0;
            //start new row
            text += "<tr align='center'>";
            //for each competitor in round, r...
            for(let c=0; c<fullSchems[e].rounds[r].length; ++c) {
                if(fullSchems[e].rounds[r][c] === ' ') {
                    text += "<td class='publicspeechschematic'> </td>";
                } else {
                    let name = fullSchems[e].rounds[r][c].match(/(?<=[A-Z]+\d+\s).+/)[0],
                        title = fullSchems[e].title,
                        eventCE = getCrossEntryText(flights,title,competitors,name);
                    text += "<td class='publicspeechschematic'>"+fullSchems[e].rounds[r][c]+eventCE+"</td>";
                }

                //increment section counter
                section++;
                //shift section counter back if over bounds
                if(section >= fullSchems[e].sections) {
                    //reset section marker
                    section = 0;
                    //close out table row
                    text += "</tr>";
                    //open new row if more names to come
                    if(c<fullSchems[e].rounds[r].length-1) {
                        text += "<tr align='center'>";
                    }
                }
            }
            //close out table html element
            text += "</table>"
        }
    }


    console.log("printed");
    $('#output').html(text);
}

function getPlacement(comp,results) {
    console.log("checking for",comp.name.match(/(?<=[A-Z]+\d+\s).+/)[0],"in",comp.event,"using results",results);
    for(let item of results) {
        if(item.name === comp.name.match(/(?<=[A-Z]+\d+\s).+/)[0] && item.event === comp.event) {
            return item.place;
        }
    }
    return false;
}

function startHome(schems) {
    $('body').load('home.html', () => {
        $('#printbyevent').on('click', () => {
            console.log("click on event");
            printByEvent(schems);
        });
        $('#printbycompetitor').on('click', () => {
            console.log("click on competitor");
            printByCompetitor(schems);
        });
        $('#printbyschool').on('click', () => {
            console.log("click on school");
            printBySchool(schems);
        });
        $('#printbyschoolcomplex').on('click', () => {
            console.log("click on school complex");
            printBySchoolComplex(schems);
        });
        $('#rankfinalists').on('click', () => {
            console.log("click on rank finalists");
            rankFinalists(schems);
        });
        $('#crossentries').on('click', () => {
            console.log("click on cross entries");
            eventCrossEntries(schems);
        });
    });

}

function main() {

    const tournID = window.location.search.slice(4);

    getEventVals(tournID)
        .then((eventVals) => {
            let schemPromises = [];
            for(let i=0; i<eventVals.length; ++i) {
                const url = "https://www.speechwire.com/c-postings-schem.php?groupingid="+eventVals[i]+"&Submit=View+postings&tournid="+tournID;
                schemPromises.push(getSchems(url));
            }
            Promise.all(schemPromises).then((schems) => {
                startHome(schems);
            });
        })
        .catch((err) => {
            console.log(err);
        })
}
