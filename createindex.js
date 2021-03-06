/* The MIT License (MIT)

Copyright (c) 2015 Hybrid Publishing Consortium
    Johannes Amorosa <amorosa@posteo.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

-- creatindex.js

This script does several things and is part of the hybrid publishing consortium
research viewer suite.

Right now it does: 
    1. Merges metadata.json with validation-report.json,
    based on there keys and writes the output to index.json.
    Everything is hard coded and ugly this will be addressed :D
    
    2. gets some git information and creates a json file
    All these files are read by the angular script for the frontend.
    This file gets executed with grunt and won't work like this.
*/


var fs 			= require('fs')
var _ 			= require('lodash')
var spawn       = require('child_process').spawn;

var pathlist 	= process.argv.slice(2)
var metadataObj = require("./" + pathlist[0]);
var reportObj 	= require("./" + pathlist[1]);

var merge = function() {
    var destination = {},
        sources = [].slice.call( arguments, 0 );
    
    sources.forEach(function( source ) {
        var prop;
        for ( prop in source ) {
            if ( prop in destination && Array.isArray( destination[ prop ] ) ) {
                
                // Concat Arrays
                destination[ prop ] = destination[ prop ].concat( source[ prop ] );
                
            } else if ( prop in destination && typeof destination[ prop ] === "object" ) {
                
                // Merge Objects
                destination[ prop ] = merge( destination[ prop ], source[ prop ] );
                
            } else {
                
                // Set new values
                destination[ prop ] = source[ prop ];
                
            }
        }
    });
    return destination;
};


// Fix for broken w3c validator showing two times same stuff .. gnarf
var arrUnique = function (arr) {
    var cleaned = [];
    arr.forEach(function(itm) {
        var unique = true;
        cleaned.forEach(function(itm2) {
            if (_.isEqual(itm, itm2)) unique = false;
        });
        if (unique)  cleaned.push(itm);
    });
    return cleaned;
}

var checkForVarsAreAList = function (arr) {
    arr.forEach(function (itm) {
        if (itm.data) {
            if (!_.isObject(itm.data.title)) {
                var newobj = []
                newobj.push(itm.data.title)
                itm.data.title = newobj 
            }
           if (!_.isObject(itm.data.contributor)) {
                var newobj = []
                newobj.push(itm.data.contributor)
                itm.data.contributor = newobj 
            }
            if (!_.isObject(itm.data.identifier)) {
                var newobj = []
                newobj.push(itm.data.identifier)
                itm.data.identifier = newobj 
            }
             if (!_.isObject(itm.data.publisher)) {
                var newobj = []
                newobj.push(itm.data.publisher)
                itm.data.publisher = newobj 
            }
        }
    })

    return arr;
}


metadataObj = checkForVarsAreAList(metadataObj)

var reportObj = arrUnique(reportObj);

// Merge the different JSON files by key
var mergeData = merge(metadataObj,reportObj)

mergeData = _.compact(_.values(mergeData));

var printableJson = JSON.stringify(mergeData, null, 2);
printableJson = printableJson.replace(/"error":/g, '"htmlerror":')



// Write index.json file
fs.writeFile("dist/index.json", printableJson, function(err) {
      if (err) throw('File save error: '+ err);
      console.log('Index file saved');
});


// We need some git infos to display in the browser
var child = spawn('git', ['log', '-1', '--pretty=format:{%n  "abbr" : "%h", %n  "commit": "%H",%n  "author":     "%an",%n  "author_email": "%ae",%n  "date": "%ad",%n  "message": "%f"%n}']);

child.stdout.on('data', function(chunk) {

    gitinfo = chunk.toString("utf-8");
    // Write gitinfo.json file
    fs.writeFile("dist/gitinfo.json", gitinfo, function(err) {
          if (err) throw('File save error: '+ err);
          console.log('gitinfo file saved');
    });
});