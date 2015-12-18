'use strict';

const express = require('express'),
	scraper = require('./scraper.js'),
	layout = require('./visualization-layout.js'),
	nunjucks = require('nunjucks');

const wikipediaPage = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_United_Kingdom_European_Union_membership_referendum';

const app = express();


nunjucks.configure('views', {
    autoescape: true,
    express: app
});

let data = scraper.updateData( wikipediaPage ); 

app.get('/',function(req, res){
	res.send( {
		error: 'nothing to see',
		updated: new Date()
	});
});

app.get('/:data.json', function (req, res) {
	if(scraper.tableKeys.indexOf(req.params.data) > -1){
		res.send( {
			data: data[req.params.data],
			updated: scraper.updated()
		} );
	}else if(req.params.data === 'data'){
		res.send( {
			data: data.combinedData,
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


app.get('/latest/:width-x-:height.svg', function (req, res) {
	let now = new Date();
	let d = data.combinedData.sort(function(a,b){
		let aDate = new Date(a.startDate.split('-'));
		let bDate = new Date(b.startDate.split('-'));
		return bDate.getTime() - aDate.getTime();
	})[0];

	res.render( 'latest.svg' , layout.latestPoll(req.params.width, req.params.height, d) );
	
	if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(wikipediaPage);
	}
});

const server = app.listen(process.env.PORT || 5000, function () {
	const host = server.address().address;
	const port = server.address().port;
	console.log(`running ${host} ${port}`);
});
