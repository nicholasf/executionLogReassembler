const fs = require('fs'),
    zlib = require('zlib'),
    querystring = require('querystring');
    async = require('async'),
    R = require('ramda');

const logDir = process.argv[2];
const outputDirName = `readable.logs${ Date.now() }`;
const distinctUrls = new Set();


fs.readdir(logDir, (e, ls) => {
    dsStoreNo = (dirname) => { return dirname !== '.DS_Store' }

    ls = R.filter(dsStoreNo, ls);

    async.eachLimit(ls, 1, unzipper, (err) => {
        if (err) {
            console.log('Err: ', err);
        }
        console.log('Done.')
        console.log(JSON.stringify(distinctUrls));
    })
});    

const unzipper = (dirname, cb) => {
    if (dirname === '.DS_STORE') {
        return cb();
    }

    fs.readdir(`${logDir}/${dirname}`, (err, res) => {
        if (err) {
            return cb(err);
        }

        //should only be 1 gz file such as 000000.gz
        fs.readFile(`${logDir}/${dirname}/${res}`, (err, gzippedFile) => {
            if (err) {
                return cb(err);
            }
            
            zlib.gunzip(gzippedFile, (err, logFile) => {
                if (err) {
                    return cb(err);
                }

                const objs = jsonifier(logFile.toString());

                const reporter = (id, cb) => {
                    if (id === '') {
                        return cb();
                    }

                    try {
                        constructURI(objs[id]);
                        constructTime(objs[id]);
                    } catch (err) {
                        return cb(err);
                    }
                    console.log(`"${ objs[id].httpMethod } ${ objs[id].reconstructedUri }",`);
                    distinctUrls.add(`"${ objs[id].httpMethod } ${ objs[id].reconstructedUri }",`);
                    // console.log(distinctUrls.size);
                };

                async.each(Object.keys(objs), reporter, (err) => {
                    if (err) {
                        err = { 
                            err: err,
                            filename: `${logDir}/${dirname}/${res}`
                        }
                    }

                    return cb(err);
                });
            });
        });
    });
};

const constructURI = (obj) => {

    // 1 Find the Path
    let path;

    if (obj.aws['HTTP_Method']) {
        let pathPieces = obj.aws['HTTP_Method'].split(',');
        obj.httpMethod = pathPieces[0].trim();
        path = pathPieces[1].split('Path')[1].trim()
    } else {
        console.log(obj)
        throw new Error('Unable to build path. Missing HTTP_Method. Look into the file.')
    }

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
    try {
        let when = obj.aws['Endpoint_response_headers'].split('Content-Type')[0];
        when = when.replace(/Date=/, '');
        when = when.replace(/(\{|\})/g, '');
        when = when.replace(/GMT,/, 'GMT');

        obj.when = when;
    } catch (err) {
    }
}

const datePattern = /\d\d\d\d-\d\d-\d\dT.*/;

const jsonifier = (logfile) => {
    const lines = logfile.split('\n');
    const ids = new Set();

    lines.forEach( (line) => {
        if (line === '') {
            return;
        };


        if (line.trim().match(datePattern)) {
            try {
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
            } catch (err) {
                console.log(err);
            }
        } else {
            // console.log('Unrecognised line, skipping: [', line, ']');
            return;
        }
    });

    return ids;
};
