'use strict';

const	request = require('request');
let updated = new Date();

module.exports = {
	updated:function(){ return updated; },
	updateData:updateData
};

function updateData(pageURL){
	updated = new Date();
	console.log('check', pageURL);
	return 'CARD DATA';
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
