const fs = require('fs'),
    zlib = require('zlib'),
    querystring = require('querystring');
    async = require('async');

const logDir = process.argv[2];

fs.readdir(logDir, (e, ls) => {
    async.each(ls, unzipper, (err) => {
        if (err) {
            console.log('Err: ', err);
            console.log(err.stack);
        } else {
            console.log('Done');
        }
    })
});    

const unzipper = (dirname, cb) => {
    fs.readdir(`${logDir}/${dirname}`, (err, res) => {
        //should only be 1 gz file such as 000000.gz
        fs.readFile(`${logDir}/${dirname}/${res}`, (err, gzippedFile) => {
            if (err) {
                console.log(`Error reading ${logDir}/${dirname}/${res}`);
                return cb(err);
            }
        
            zlib.gunzip(gzippedFile, (err, logFile) => {
                if (err) {
                    return cb(err);
                }

                const objs = jsonifier(logFile.toString());

                let unique = new Set();

                const output = (id, cb) => {
                    constructURI(objs[id]);
                    // console.log(objs[id]);
                    if (objs[id].httpVerb.trim() != 'OPTIONS,' && !objs[id].reconstructedUri.includes('proxy')) {
                        const line = `${objs[id].httpVerb.trim()}${ objs[id].reconstructedUri.trim() }`; 

                        // now repair time patterns, for some reason AWS removes colons from timestamps
                        // if (line.includes('Date') || line.includes('date')) {
                        //     // GET,/nav?startDateTime=2021-07-24T005200.000Z&type=upcoming-sports


                        if (!unique.has(line)) {
                            // console.log(objs[id]);
                            unique.add(line);
                            console.log(line);                            
                        }
                    }
                };


                async.each(Object.keys(objs), output, (err) => {
                    if (err) {
                        console.log('Err: ', err);
                    }
                });
            });
        });
    });
};


const constructURI = (obj) => {
    let path, verb;

    if (obj.aws['Endpoint_request_body_after_transformations']) {
        let pathPieces = obj.aws['Endpoint_request_body_after_transformations'].trim().split('httpMethod')[0];
        path = pathPieces.split('path')[1];
        path = path.replace(/" "/g, '');
        path = path.replace(/","/g, '');    
    } else {
        let pieces = obj.aws['HTTP_Method'].split('Resource Path');
        path = pieces[1].trim();
        verb = pieces[0];
    }

    let queryString = obj.aws['Method_request_query_string'].replace(/(\{|\})/g, '');
    const keyValuePairs = queryString.split(',');
    const query = {};

    keyValuePairs.forEach((kvp) => {
        const pieces = kvp.split('=');
        query[pieces[0].trim()] = pieces[1];
    })

    // console.log(query);
    if (query.startDateTime) {
        query.startDateTime = repairDate(query.startDateTime);
    }

    if (query.endDateTime) {
        query.endDateTime = repairDate(query.endDateTime);
    }

    let uriQuery = querystring.unescape(querystring.stringify(query).trim());
    uriQuery = uriQuery.replace(/%20/g, '');
    const uri = `${ path }?${ uriQuery }`
    obj.reconstructedUri = uri;
    obj.httpVerb = verb || 'GET,';
};

// 2021-07-24T005200.000Z
const repairDate = (dateString) => {
    dateString = dateString.replace(/ /g, '');
    const datePieces = dateString.split('T')
    const hourMinSecMilli = datePieces[1];
    const timePieces = hourMinSecMilli.split('.');
    const hourMinSec = timePieces[0];
    
    const repairedHourMinSec= `${ hourMinSec.substring(0,2) }:${ hourMinSec.substring(2,4) }:${ hourMinSec.substring(4, 6) }`;

    const repairedTime = `${ datePieces[0] }T${ repairedHourMinSec }.${ timePieces[1]}`;

    return repairedTime;
};

const constructTime = (obj) => {
    let time = obj.aws['Endpoint_response_headers'].split('Content-Type');
    time = time.replace(/Date=/, '');
    obj.time = time;
}

const jsonifier = (logfile) => {
    const lines = logfile.split('\n');
    const ids = new Set();

    lines.forEach( (line) => {
        if (line === '') {
            return;
        };

        const pieces = line.split(' ');

        const id = pieces[1].replace(/(\(|\))/g, '');

        if (!ids[id]) {
            ids[id] = {
                id: id,
                aws: {}
            };
        }

        const log = pieces.slice(2).join(' ');
        const logPieces = log.split(':');
        const key = logPieces[0].replace(/ /g, '_');
        ids[id]['aws'][key] = logPieces.slice(1).join(' ');
    });

    return ids;
};
