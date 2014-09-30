var fs = require('fs'),
    request = require('request'),
    libxmljs = require('libxmljs'),
    LineByLineReader = require('line-by-line'),
    lineReader = new LineByLineReader('input.csv');

var locations = [];

lineReader.on('error', function (err) {
  console.log(err);
});

lineReader.on('line', function (line) {
    var lines = line.split(',');
    var city = lines[0].replace('"', '');
    var state = lines[1].replace('"', '');
    var radius = parseInt(lines[2]);
    locations.push( {city:city, state:state, radius:radius} );
});

lineReader.on('end', function () {
  var stream = fs.createWriteStream('labor.json');
  var jsonObj = [];
  stream.once('open', function(fd) {
    var doWork = function(locationsIn) {
      if(locationsIn.length < 1) {
        stream.write(JSON.stringify(jsonObj));
        console.log('Hot damn! Zip code generation is complete.');
        stream.end();
      }
      else {
        var location = locationsIn.shift();
        getLatLng(location, function(err, latLng) {
          var lat = latLng.lat,
              lng = latLng.lng;
          getZipcodes(location.radius, lat, lng, function(err, zipcodes) {
            if(!err) {
              var loc = {};
              loc.city = location.city;
              loc.state = location.state;
              loc.lat = lat;
              loc.lng = lng;
              loc.radius = location.radius;
              loc.zipcodes = zipcodes;
              
              jsonObj.push(loc);
              doWork(locationsIn);
            }
          });
        });
      }
    };
    doWork(locations);
  });
});

function getLatLng(location, callback) {
  var api_key = 'AIzaSyDhFnQm_pp5QJ02B4CwDxMFryp6u2nXzQc',
      url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location.city + ',' + location.state + '&key=' + api_key;

  request(url, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var jsonObj = JSON.parse(body),
          lat = jsonObj.results[0].geometry.location.lat,
          lng = jsonObj.results[0].geometry.location.lng;
      callback(null, {lat:lat, lng:lng});
    }
    else {
      callback(err, null);
    }
  });
}

function getZipcodes(radius, lat, lng, callback) {
  var url = 'http://www.freemaptools.com/ajax/get-all-zip-codes-inside.php?radius=' + radius + '&lat=' + lat + '&lng=' + lng + '&rn=5612',
      options = {
        url: url,
        headers: {
          'Referer': 'http://www.freemaptools.com/find-zip-codes-inside-radius.htm'
        }
      };

  request(options, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var xmlDoc = libxmljs.parseXml(body),
          markers = xmlDoc.get('//markers').childNodes(),
          zipcodes = [];

      for (var i = 0; i < markers.length; i++) {
        var marker = markers[i],
            zipcode = marker.attr('zipcode').value();
        zipcodes.push(zipcode);
      }
      callback(null, zipcodes);
    }
    else {
      callback(err, null);
    }
  });
}