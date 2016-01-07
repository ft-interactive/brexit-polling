'use strict';

const express = require('express'),
	scraper = require('./scraper.js'),
	layout = require('./visualization-layout.js'),
	nunjucks = require('nunjucks'),
	isoShortFormat = require('d3-time-format').format('%Y-%m-%d');

const wikipediaPage = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_United_Kingdom_European_Union_membership_referendum';

const app = express();


nunjucks.configure('views', {
    autoescape: true,
    express: app
}).addFilter('isoShortFormat',isoShortFormat);

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
			updated: scraper.updated(),
			source: wikipediaPage
		} );
	}else{
		res.send( {
			error: 'no data found for ' + req.params.data,
			updated: scraper.updated(),
			source: wikipediaPage
		} );
	}

	let now = new Date();
	if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(wikipediaPage);
	}
});

app.get('/data.html', function (req, res) {
    let now = new Date();
    res.render( 'data.html' , {
        data: data.combinedData,
        updated: scraper.updated(),
        source: wikipediaPage
    });
    
    if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(wikipediaPage);
	}
});


app.get('/poll/:id/:width-x-:height.svg', function (req, res) {
	let now = new Date();
	let d = data.combinedData.sort(onDate)[0];
	if(req.params.id == 'latest'){
		d = data.combinedData.sort(onDate)[0];
	}else{
		let parts = req.params.id.split(',');
		d = data.combinedData
			.filter( e => (e.pollster == parts[0]) )
			.filter( e => (isoShortFormat(e.startDate) == parts[1]) )[0];
	}
	
	res.render( 'single-poll.svg' , layout.singlePoll(req.params.width, req.params.height, d, true) );
	
	if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(wikipediaPage);
	}
});

app.get('/lastmonth/:width-x-:height.svg', function (req, res) {
	let now = new Date();
	let startDate = new Date();
	startDate.setMonth(startDate.getMonth()-1 );
	let dateRange = [ startDate, now] // last month
	let config = layout.timeSeries(req.params.width, req.params.height, dateRange, data.combinedData);
	console.log(config);
	res.render( 'monthly.svg' , config );
	
	if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(wikipediaPage);
	}
});

function onDate(a,b){
	return b.startDate.getTime() - a.startDate.getTime();
}
const server = app.listen(process.env.PORT || 5000, function () {
	const host = server.address().address;
	const port = server.address().port;
	console.log(`running ${host} ${port}`);
});
