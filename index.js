'use strict';

const express = require('express'),
	scraper = require('./scraper.js'),
	wikipediaPage = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_United_Kingdom_European_Union_membership_referendum';

const app = express();
let data = scraper.updateData(wikipediaPage);

app.get('/',function(req, res){
	res.send( {
		error: 'nothing to see',
		updated: new Date()
	} );
});

app.get('/brexit/:data.json', function (req, res) {
	if(scraper.tableKeys.indexOf(req.params.data) > -1){
		res.send( {
			data: data[req.params.data],
			updated: scraper.updated()
		} );
	}else if(req.params.data === 'data'){
		let combinedData = scraper.tableKeys.reduce(function(previousValue, currentValue){
				return previousValue.concat( data[currentValue] );
			},[]);

		res.send( {
			data: combinedData,
			updated: scraper.updated()
		} );

	}else{
		res.send( {
			error: 'no data found for ' + req.params.data,
			updated: scraper.updated()
		} );
	}

	let now = new Date();
	if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(wikipediaPage);
	}
});



const server = app.listen(5000, function () {
	const host = server.address().address;
	const port = server.address().port;
});