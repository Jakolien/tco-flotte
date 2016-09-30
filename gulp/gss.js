'use strict';

import path from 'path';
import fs   from 'fs';
import _    from 'lodash';
import gulp from 'gulp';
import Gss  from 'google-spreadsheet';
import {paths, clientPath, serverPath} from './paths';

let GSSID = '1BDZ0IdPADc13aKokVZZ5VFbyUUqQdbRZJgqWGK6EEHc';
let BOOL_FIELDS = ['hasslider', 'hashelp', 'canbeonxaxis', 'shownonthelist', 'preliminary', 'editable', 'relative'];
let NUMBER_FIELDS = ['importancerank', 'interval']
let UNWANTED_FIELDS = ['_xml', '_links'];

var prepareRows = function(rows) {
  return _.map(rows, function(row) {
    var exists = k => typeof(row[k]) !== 'undefined'
    // Remove unwanted properties
    for(let k of UNWANTED_FIELDS) {
      if(exists(k)) delete row[k];
    }
    // Convert values to boolean
    for(let k of BOOL_FIELDS) {
      if(exists(k)) row[k] = (row[k] || '').toLowerCase()[0] === 't';
    }
    // Convert values to number
    for(let k of NUMBER_FIELDS) {
      if(exists(k)) row[k] = 1 * row[k];
    }
    // Convert to null when empty
    for(let k in row) {
      if( row[k] === '' ) row[k] = null;
    }
    return row;
  });
}


gulp.task('gss:settings', function (cb) {

  let gss = new Gss(GSSID);

  gss.getRows(1, function(err, rows){
    var data = prepareRows(rows);
    var file = JSON.stringify(data, null, 2);
    // And override the existinng JSON file
    fs.writeFile(path.join(clientPath, "assets/settings.json"), file, cb);
  });
});

gulp.task('gss:display', function (cb) {

  let gss = new Gss(GSSID);

  gss.getRows(2, function(err, rows){
    var data = prepareRows(rows);
    var file = JSON.stringify(data, null, 2);
    // And override the existinng JSON file
    fs.writeFile(path.join(clientPath, "assets/display.json"), file, cb);
  });
});

gulp.task('gss', ["gss:settings", "gss:display"]);
