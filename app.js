/**
 * Created by xerxes on 4/13/14.
 */

(function () {
    var fs, app, express, path, logger, boydParser, methodOverride, _routes, async;
    express = require('express');
    path = require('path');
    logger = require('morgan');
    bodyParser = require('body-parser');
    methodOverride = require('method-override');
    fs = require('fs');
    _routes = express.Router();
    async = require('async');

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

        if (typeof req.body['name'] !== 'undefined') {
            var name = req.body['name'];
            try {
                var file = fs.readFileSync(app.get('upload_dir') + '/' + name);
                var file = {
                    name: name,
                    type: 'audio/wav',
                    contents: "data:audio/wav;base64,".concat(new Buffer(file).toString("base64"))
                };
                return res.send({status: true, file: file});
            } catch (err) {
                return res.send({status: false, msg: err});
            }
        } else {
            return res.send({status: false, msg: 'File not found'});
        }

    })
    app.listen(app.get('port'), function () {
        return console.log("Listening on " + (app.get('port')) + "..");
    });

}());

