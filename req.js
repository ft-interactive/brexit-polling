'use strict';

const request = require('request');

getPage('http://www.toffeemilkshake.co.uk')
	.then(function(page){
		console.log(page);
	})
	.catch(function(reason){
		console.log('Failed :( ', reason);
	});	


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