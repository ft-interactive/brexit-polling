'use strict';

const	request = require('request');
let updated = new Date(2015,0,1);


function updateData(pageURL){
	let story = {};
	console.log('updating...', pageURL);
	updated = new Date();
	getPage(pageURL)
		.then(function(page){

			story.data = JSON.parse(page);
			story.data.text = story.data.text.replace(/\"\/content/g,'"//next.ft.com/content');
			updated = new Date();
			return story;
		})
		.catch(function(reason){
			console.error('ERROR: Failed to get ' + pageURL + ' - ' + reason + ' ' + new Date()); //logentries pattern 'ERROR: Failed to get'
		});
	return story;
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
	updated:function(){ return updated; },
	updateData:updateData
};
