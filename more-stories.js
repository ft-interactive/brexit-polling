'use strict';
const	request = require('request');

let berthaURL = 'https://bertha.ig.ft.com/view/publish/ig/1GEBwWBf6IZ2S4WOdv_sv6QNqrdD8LNxLLoZKPGA5VxA/basic,stories';
var data = [];
let updated = new Date(2015,0,1);

updateData();

function updateData(){
	console.log('update data')
	request(berthaURL, function (error, response, body) {		
		if (error) {
			console.error('ERROR: ' + error.message);
			return;
		}
		data = JSON.parse(body).stories;
		updated = new Date();
	});

	return data;
}

module.exports = {
	getData:function(){
		return data;
	},
	updateData: updateData,
	updated: function(){
		return updated
	},
	invalidate:function(){
		updated = new Date(2015,0,1);
	},
};
