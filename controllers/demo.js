/**
 * Created by xerxes on 4/13/14.
 */

var app = angular.module('demoApp', []);

app.factory('upload_record', function ($http, $q) {
    var upload_record = {};
    upload_record.upload = function (rec_data) {
        var d = $q.defer();
        var url = '/upload';
        $http({'method': 'POST', url: url, data: rec_data}).success(function (data, status, headers, config) {
            upload_record.status = data;
            d.resolve();
        });
        return d.promise;
    }
    return upload_record;
});
app.factory('fetch_audio', function ($http, $q) {
    var fetch_audio = {};
    fetch_audio.fetch_link = function () {
        var d = $q.defer();
        var url = '/fetch_link';
        $http({method: 'GET', url: url}).success(function (data, status, headers, config) {
            if (data.status === true) {
                fetch_audio.links = data.links;
            } else {
                fetch_audio.links = null;
            }
            d.resolve();
        });
        return d.promise;
    };
    fetch_audio.fetch_data = function (name) {
        var d = $q.defer();
        var url = '/fetch_data';
        $http({method: 'POST', url: url, data: name}).success(function (data, status, headers, config) {
            if (data.status === true) {
                fetch_audio.file = data.file;
            } else {
                fetch_audio.status = false;
                fetch_audio.file = null;
            }
            d.resolve();
        });
        return d.promise;
    };
    return fetch_audio;
});
app.controller('demoApp', function ($scope, upload_record, fetch_audio) {
    $scope.startRecording = document.getElementById('start-recording');
    $scope.stopRecording = document.getElementById('stop-recording');
    $scope.cameraPreview = document.getElementById('camera-preview');
    $scope.audio = document.querySelector('audio');
    $scope.isFirefox = !!navigator.mozGetUserMedia;
    $scope.recordAudio = undefined;
    $scope.audio_data = undefined;
    $scope.links = undefined;
    $('#record-url').attr("disabled", true);
    $('#upload-url').attr("disabled", true);
    fetch_audio.fetch_link().then(function () {
        $scope.links = fetch_audio.links;
    });
    $scope.start_recording = function () {
        $('#record-url').attr("disabled", true);
        $('#upload-url').attr("disabled", true);

        $scope.audio_data = undefined;
        $scope.startRecording.disabled = true;
        navigator.getUserMedia({
            audio: true
        }, function (stream) {
            $scope.cameraPreview.src = window.URL.createObjectURL(stream);
            $scope.cameraPreview.play();

            $scope.recordAudio = RecordRTC(stream, {
                bufferSize: 16384
            });

            $scope.recordAudio.startRecording();
            $scope.stopRecording.disabled = false;
        }, function (error) {
            alert(JSON.stringify(error));
        });
    };
    $scope.stop_recording = function () {
        $('#record-url').attr("disabled", false);
        $('#upload-url').attr("disabled", false);

        $scope.startRecording.disabled = false;
        $scope.stopRecording.disabled = true;

        $scope.recordAudio.stopRecording(function () {
            onStopRecording(function (data) {
                $scope.audio_data = data;
                $scope.audio.src = '';
                $("#record-url").attr("href", data);
            });
        });
        function onStopRecording(callback) {
            $scope.recordAudio.getDataURL(function (audioDataURL) {
                callback(audioDataURL)
            });
        }
    };
    $scope.do_upload = function () {
        /*console.log('will upload data to specific url ', $scope.audio_data);*/

        var fileName = getRandomString();
        var files = { };
        files.audio = {
            name: fileName + ($scope.isFirefox ? '.webm' : '.wav'),
            type: $scope.isFirefox ? 'video/webm' : 'audio/wav',
            contents: $scope.audio_data
        };
        console.log(files);
        files.isFirefox = $scope.isFirefox;
        upload_record.upload(files).then(function (data) {
            if (upload_record.status['status'] === true) {
                $('#upload-url').attr("disabled", true);
                fetch_audio.fetch_link().then(function () {
                    $scope.links = fetch_audio.links;
                });
            }
        });
    };
    $scope.play_link = function (link_to_play) {
        fetch_audio.fetch_data(link_to_play).then(function () {
            if (fetch_audio.status !== false) {
                var file= fetch_audio.file;
                console.log(file);
            }
        });
    };
});

function getRandomString() {
    if (window.crypto) {
        var a = window.crypto.getRandomValues(new Uint32Array(3)),
            token = '';
        for (var i = 0, l = a.length; i < l; i++) token += a[i].toString(36);
        return token;
    } else {
        return (Math.random() * new Date().getTime()).toString(36).replace(/\./g, '');
    }
}


