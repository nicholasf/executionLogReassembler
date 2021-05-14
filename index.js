const fs = require('fs'),
    zlib = require('zlib'),
    querystring = require('querystring');
    async = require('async');

const logDir = process.argv[2];
const outputDirName = `readable.logs${ Date.now() }`;

fs.mkdir(outputDirName, (err) => {
    fs.readdir(logDir, (e, ls) => {
        async.each(ls, unzipper, (err) => {
            if (err) {
                console.log('Err: ', err);
            } else {
                console.log('Done');
            }
        })
    });    
});

const unzipper = (dirname, cb) => {
    fs.readdir(`${logDir}/${dirname}`, (err, res) => {
        //should only be 1 gz file such as 000000.gz
        fs.readFile(`${logDir}/${dirname}/${res}`, (err, gzippedFile) => {
            zlib.gunzip(gzippedFile, (err, logFile) => {
                const objs = jsonifier(logFile.toString());


                const writer = (id, cb) => {
                    constructURI(objs[id]);
                    // console.log(objs[id].reconstructedUri);
                    fs.writeFile(`${ outputDirName }/${ id }.json`, JSON.stringify(objs[id], null, 4), cb);
                };

                async.each(Object.keys(objs), writer, (err) => {
                    if (err) {
                        console.log('Err: ', err);
                    }
                });
            });
        });
    });
};


const constructURI = (obj) => {
    let pathPieces = obj.aws['Endpoint_request_body_after_transformations'].trim().split('httpMethod')[0];
    let path = pathPieces.split('path')[1];
    path = path.replace(/" "/g, '');
    path = path.replace(/","/g, '');
    let queryString = obj.aws['Method_request_query_string'].replace(/(\{|\})/g, '');
    const keyValuePairs = queryString.split(',');
    const query = {};

    keyValuePairs.forEach((kvp) => {
        const pieces = kvp.split('=');
        query[pieces[0]] = pieces[1];
    })

    const uri = `${ path }?${ querystring.stringify(query) }`
    obj.reconstructedUri = uri;
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
