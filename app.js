/**
 * Created by xerxes on 4/13/14.
 */

(function () {
    var fs, sys, app, express, path, logger, boydParser, methodOverride, _routes, mysql, db, async;
    express = require('express');
    path = require('path');
    logger = require('morgan');
    bodyParser = require('body-parser');
    methodOverride = require('method-override');
    fs = require('fs');
    sys = require('sys');
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
    /*app.use(logger());*/
    app.use(bodyParser({
        limit: '60mb'
    }));
    app.use(methodOverride());

    // all environments
    app.set('port', process.env.PORT || 3000);
    app.set('upload_dir', './uploads');
    //static files
    app.use(express.static(path.join(__dirname, '/controllers/')));


    // all routes
    app.use('/', _routes);


    _routes.get('/', function (req, res) {
        return res.sendfile('index.html');
    });
    //upload data
    _routes.post('/upload', function (req, res) {
        var file = req.body.audio;
        var fileRootName = file.name.split('.').shift(),
            fileExtension = file.name.split('.').pop(),
            filePathBase = app.get('upload_dir') + '/',
            fileRootNameWithBase = filePathBase + fileRootName,
            filePath = fileRootNameWithBase + '.' + fileExtension,
            fileBuffer;

        try {
            while (fs.existsSync(filePath)) {
                filePath = fileRootNameWithBase + fileExtension;
            }

            file.contents = file.contents.split(',').pop();
            fileBuffer = new Buffer(file.contents, "base64");
            fs.writeFileSync(filePath, fileBuffer);
            return res.send({status: true, msg: 'successfully saved to disk'});
        } catch (err) {
            return res.send({status: false, msg: err});
        }


    });
    _routes.get('/fetch_link', function (req, res) {
        try {
            var files = fs.readdirSync(app.get('upload_dir'));
            return res.send({status: true, links: files});
        } catch (err) {
            return res.send({status: false, msg: err});
        }
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

