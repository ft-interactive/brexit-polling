'use strict';
const	request = require('request');
const	cheerio = require('cheerio');
const	csv = require('d3-dsv').csv;
const   failsafe = require('./failsafe.js');
const	d3Array = require('d3-array');

let updated = new Date(2015,0,1);

const berthaURL = 'http://bertha.ig.ft.com/republish/publish/ig/1-6KQk69BMeQP5MdjsrsbCrugWcDVZ-2mFKtpdr9-Riw/basic';


let data = {};

function updateData(){
	console.log('updating...', berthaURL);

	getPage(berthaURL)
		.then(function(page){
			var newData = JSON.parse(page).data;
			if(newData.length >= data.combinedData.length){
				data.combinedData = JSON.parse(page).data;
				data.updated = new Date();
				data.smoothedData = smooth(data.combinedData);				
			}
		})
		.catch(function(reason){
			console.error('ERROR: Failed to get ' + pageURL + ' - ' + reason + ' ' + new Date()); //logentries pattern 'ERROR: Failed to get'    
		});

	return data;
}

function getPage(url) {
	return new Promise(
		function (resolve, reject) {
			request(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					resolve( body );
				}else{
					reject(' REJECTED ' + error);
				}
			})
		});
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