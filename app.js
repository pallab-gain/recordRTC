/**
 * Created by xerxes on 4/13/14.
 */

(function () {
    var app, express, path, logger, boydParser, methodOverride, _routes, mysql, db, async;
    express = require('express');
    path = require('path');
    logger = require('morgan');
    bodyParser = require('body-parser');
    methodOverride = require('method-override');
    _routes = express.Router();
    mysql = require('mysql');
    async = require('async');


    db = mysql.createConnection({
        host: 'localhost',
        port: 3306,
        database: 'record_rtc',
        user: 'root',
        password: ''
    });
    db.connect(function (err, status) {
        if (err) {
            console.err(err);
        } else {
            console.log('mysql connect successful!');
        }
    })

    app = express();
    app.use(logger());
    app.use(bodyParser({
        limit: '60mb'
    }));
    app.use(methodOverride());

    // all environments
    app.set('port', process.env.PORT || 3000);
    //static files
    app.use(express.static(path.join(__dirname, '/controllers/')));


    // all routes
    app.use('/', _routes);


    _routes.get('/', function (req, res) {
        return res.sendfile('index.html');
    });
    //upload data
    _routes.post('/upload', function (req, res) {
        var audio = req.body.audio;
        var name = audio['name'];
        var type = audio['type'];
        var contents = new Buffer( (audio['contents'].split(',')) [1],"base64");

        var sql = db.format('insert into audio_table(name,type,contents) values (?,?,?)', [name, type, contents]);
        /*console.log(contents);*/
        async.series([
            function (callback) {
                db.query(sql, function (err, status) {
                    if (err) {
                        return callback(err, null);
                    } else {
                        return callback(null, status);
                    }
                })
            }
        ], function (err, result) {
            if (err) {
                return res.send({status: false, msg: err});
            } else {
                return res.send({status: true, msg: 'Successfully saved!'});
            }
        });
    });
    _routes.get('/fetch_link', function (req, res) {
        var sql = db.format('select name as name from audio_table', []);
        db.query(sql, function (err, args) {
            if (err) {
                return res.send({status: false, msg: 'error fetching url list'});
            } else {
                return res.send({status: true, links: args});
            }
        })
    });
    _routes.post('/fetch_data', function (req, res) {
        var name = req.body;
        var sql = db.format('select type, contents from audio_table where name = ?', [name['name']]);
        db.query(sql, function (err, data) {
            data = data[0];
            if (err) {
                return res.send({status: false});
            } else {
                var file = {
                    name: name,
                    type: data.type,
                    contents: "data:audio/wav;base64,".concat(new Buffer(data.contents).toString("base64"))
                };
                /*console.log(file);*/
                return res.send({status: true, file: file});
            }
        });
    })
    app.listen(app.get('port'), function () {
        return console.log("Listening on " + (app.get('port')) + "..");
    });

}());
