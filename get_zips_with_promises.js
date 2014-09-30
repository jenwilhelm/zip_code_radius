var Q = require('q'),
    request = require('request'),
    fs = require('fs'),
    libxmljs = require('libxmljs'),
    LineByLineReader = require('line-by-line'),
    lineReader = new LineByLineReader('input.csv');

// READ VALUES FROM SPREADSHEET AND BUILD OBJECT
function readSpreadsheet() {
  var def = Q.defer(),
      locations = [];

  Q.try(function() {
    lineReader.on('error', function (err) {
      def.reject(err);
    });

    lineReader.on('line', function (line) {
      var lines = line.split(','),
          city = lines[0].replace('"', ''),
          state = lines[1].replace('"', ''),
          radius = parseInt(lines[2]);
      locations.push( {city:city, state:state, radius:radius, zips:[]} );
    });

  }).then(function() {

    lineReader.on('end', function () {
      def.resolve(locations);
    });

  });
  return def.promise;
}

function getLatLng(locations) {
  var def = Q.defer(),
      api_key = 'AIzaSyDhFnQm_pp5QJ02B4CwDxMFryp6u2nXzQc';
  
  var doWork = function(locationsInput) {
    if (locationsInput.length == 0) {
      def.resolve(locations);
    } else {
      var locationInput = locationsInput.shift();
      var url = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + locationInput.city + ',' + locationInput.state + '&key=' + api_key;

      request(url, function (err, res, body) {
        if (!err && res.statusCode == 200) {

          // Assign lat/lng to original locations object
          for (location in locations) {
            if(location.city == locationInput.city) {
              var jsonObj = JSON.parse(body);
              location.lat = jsonObj.results[0].geometry.location.lat;
              location.lng = jsonObj.results[0].geometry.location.lng;
            }
          }
        }
        else {
          def.reject(err);
        }
      }); // end request
    } // end else
  }; // end doWork

  var locationsInput = locations.slice(0);  // clone array
  doWork(locationsInput);
  return def.promise;
}

function getZipcodes(locations) {
  var def = Q.defer();

  var doWork = function(locationsInput) {

    if (locationsInput.length == 0) {
      def.resolve(locations);
    } else {
      var locationInput = locationsInput.shift();
      var url = 'http://www.freemaptools.com/ajax/get-all-zip-codes-inside.php?radius=' + locationInput.radius + '&lat=' + locationInput.lat + '&lng=' + locationInput.lng + '&rn=5612';
      var options = {
        url: url,
        headers: {'Referer':'http://www.freemaptools.com/find-zip-codes-inside-radius.htm'}
      };

      request(options, function (err, res, body) {
        if (!err && res.statusCode == 200) {
          var xmlDoc = libxmljs.parseXml(body),
              markers = xmlDoc.get('//markers').childNodes(),
              zipcodes = [];

          // Parse XML for zip codes
          for (var i = 0; i < markers.length; i++) {
            var marker = markers[i],
                zipcode = marker.attr('zipcode').value();
            zipcodes.push(zipcode);
          }
            
          // Assign zip codes to original locations object
          for (location in locations) {
            if(location.city == locationInput.city) {
              location.zipcodes = zipcodes;
            }
          }

          doWork(locationsInput);
        }
        else {
          def.reject(err);
        }
      }); // end request
    } // end else
  };// end doWork

  var locationsInput = locations.slice(0);  // clone array
  doWork(locationsInput);
  return def.promise;
}

function createJson(locations) {
  console.log(locations);
  // var def = Q.defer(),
  //     stream = fs.createWriteStream('labor.json');
  // stream.once('open', function(fd) {
  //   stream.write(cityAndState.city);
  //   stream.write(", ");
  //   stream.write(cityAndState.state);
  //   stream.write(":");
  // }
  // stream.end();
  // def.resolve();
  // return def.promise;
}

Q.fcall(readSpreadsheet())
.then(function(locations) {
  getLatLng(locations);
})
.then(function(locations) {
  getZipcodes(locations);
})
.then(function(locations) {
  createJson(locations);
})
.then(function() {
  console.log('Hot damn! Zip code generation is complete.');
})
.catch(function(err) {
  console.log(err);
})
.done();