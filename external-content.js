'use strict';

const	request = require('request');
let updated = new Date(2015,0,1);
let data = '';

module.exports = {
	updated:function(){ return updated; },
	updateData:updateData
};

function updateData(pageURL){
	console.log('check', pageURL);
	updated = new Date();

	getPage(pageURL)
		.then(function(page){
			data = JSON.parse(page).fragment;
			updated = new Date();
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
