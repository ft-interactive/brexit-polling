'use strict';
const	request = require('request');
const   failsafe = require('./failsafe.js');
const   smooth = require('./smooth.js');

let updated = new Date(2015,0,1);

const berthaURL = 'http://bertha.ig.ft.com/republish/publish/ig/1-6KQk69BMeQP5MdjsrsbCrugWcDVZ-2mFKtpdr9-Riw/basic';

failsafe.combinedData = failsafe.combinedData.map(fixDates)
var data = failsafe;

updateData();

function updateData(){
	console.log('updating...', berthaURL);

	request(berthaURL, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			let newData = JSON.parse(body).data;
			if(newData.length >= data.combinedData.length){
				data.combinedData = newData.map(fixDates).filter(function(d){ return ( d.undecided!==null )});
				data.updated = new Date();
				data.smoothedData = smooth(data.combinedData);			
			}
		}else{
			console.error('ERROR: Failed to get ' + pageURL + ' - ' + reason + ' ' + new Date()); //logentries pattern 'ERROR: Failed to get'    
		}
	});

	return data;
}

function fixDates(d){
	d.date = new Date(d.date);
	d.startdate = new Date(d.startdate);
	d.enddate = new Date(d.enddate);
	return d;
}

module.exports = {
	updateData:updateData,
	updated:function(){
		return updated
	},
	invalidate:function(){
		updated = new Date(2015,0,1);
	},
};