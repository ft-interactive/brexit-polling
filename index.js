'use strict';

const express = require('express'),
	scraper = require('./scraper.js'),
	layout = require('./visualization-layout.js'),
	nunjucks = require('nunjucks'),
    memjs = require('memjs'),

    memcache = memjs.Client.create(),
	isoShortFormat = require('d3-time-format').format('%Y-%m-%d');

const dataSource = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_United_Kingdom_European_Union_membership_referendum';

const app = express();

nunjucks.configure('views', {
    autoescape: true,
    express: app
}).addFilter('isoShortFormat',isoShortFormat);

let data = scraper.updateData( dataSource ); 

app.get('/',function(req, res){
    memcache.get('0', function(err, value) {
        if(value){
            res.send(value);
        }else{
            value = {
                error: 'nothing to see',
                updated: new Date() };
            memcache.set('0',  value);
            res.send(value);
        }
    })

});

app.get('/data.json', function (req, res) {
    res.send( {
        data: data.combinedData,
        updated: scraper.updated(),
        source: dataSource
    } );
	let now = new Date();
	if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(dataSource);
	}
});

app.get('/data.html', function (req, res) {
    let now = new Date();
    res.render( 'data.html' , {
        data: data.combinedData,
        updated: scraper.updated(),
        source: dataSource
    });
    
    if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(dataSource);
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
		return data = scraper.updateData(dataSource);
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
		return data = scraper.updateData(dataSource);
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
