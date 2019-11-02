window.onload = function() {
    main();
}

function call(url) {
    return new Promise((resolve, reject) => {
        let page = "";
        $.get(url, (data, status) => {
            page = data;
            if(status==="success") {
                resolve(page);
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

function getSchems(url) {

    return new Promise((resolve, reject) => {
        call(url)
            .then((page) => {
                let reg1 = /<table class=['"]publicschematic['"].+?>.+?<\/table>/,
            		round1 = page.match(reg1)[0];
            	let reg2 = /(?<=<td class="publicspeechschematic">(?!\d))(\w+\s*'*\-*){2,}?(?=<\/td>)/g,
            		names = round1.match(reg2);
            	let reg3 = /(?<=<p class=("|')pagesubtitle("|')>)(\w|\s)+?(?=<\/p>)/,
            		title = page.match(reg3)[0];
                resolve({names:names,title:title});
            })
            .catch((err) => {
                console.log(err);
            });
    });
}

function printByEvent(schems) {
    let text = "";
    for(let i=0; i<schems.length; ++i) {
        text += "<table class='publicschematic' width='100%'><tr align='center' class='publicschematicheader'><td style='border-bottom: 3px solid #009'>"+schems[i].title+"</td></tr>";
        for(let j=0; j<schems[i].names.length; ++j) {
            text += "<tr align='center'><td class='publicspeechschematic'>"+schems[i].names[j]+"</td></tr>";
        }
        text += "</table>"
    }
    console.log("printed");
    $('#output').html(text);
}

function printByCompetitor(schems) {
    let competitors = [];
    console.log(schems);
    for(let i=0; i<schems.length; ++i) {
        for(let j=0; j<schems[i].names.length; ++j) {
            const getCompRegex = /(?<=[A-Z]+\d+\s).+/,
                  name = schems[i].names[j].match(getCompRegex)[0];
            if(name) {
                if(name.match(/\sand\s/)) {
                    const name1 = name.match(/(\w+\s*'*\-*)+?(?=\sand)/)[0],
                          name2 = name.match(/(?<=\sand\s)(\w+\s*'*\-*)+/)[0];
                    console.log("duo with",name1,"and",name2);
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
                            const comp1 = comp.match(/(\w+\s*'*\-*)+?(?=\sand)/)[0],
                                  comp2 = comp.match(/(?<=\sand\s)(\w+\s*'*\-*)+/)[0];
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
    let competitors = [];
    for(let i=0; i<schems.length; ++i) {
        for(let j=0; j<schems[i].names.length; ++j) {
            const getCompRegex = /(?<=[A-Z]+\d+\s).+/,
                  name = schems[i].names[j].match(getCompRegex)[0];
            if(name) {
                if(name.match(/\sand\s/)) {
                    const name1 = name.match(/(\w+\s*'*\-*)+?(?=\sand)/)[0],
                          name2 = name.match(/(?<=\sand\s)(\w+\s*'*\-*)+/)[0];
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
                            const comp1 = comp.match(/(\w+\s*'*\-*)+?(?=\sand)/)[0],
                                  comp2 = comp.match(/(?<=\sand\s)(\w+\s*'*\-*)+/)[0];
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
        })
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
        })
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
