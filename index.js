'use strict';

const express = require('express'),
	scraper = require('./scraper.js'),
	layout = require('./layouts/index.js'),
	nunjucks = require('nunjucks'),
    lru = require('lru-cache'),
    d3TimeFormat = require('d3-time-format').format,
	isoShortFormat = d3TimeFormat('%Y-%m-%d'),
    ftDateFormat = d3TimeFormat('%e %b %Y');

const wikipediaPage = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_United_Kingdom_European_Union_membership_referendum';

let data = [];

const cache = lru({
    max: 500,
    maxAge: 1000*60 //60 seconds
});

const app = express();

nunjucks.configure('views', {
    autoescape: true,
    express: app
})
.addFilter('isoShortFormat',isoShortFormat)
.addFilter('ftDateFormat',ftDateFormat)
.addFilter('replaceNaN', function(n){
    if(n=='NaN' || isNaN(n)){
        return '-';
    }
    return n;
})
.addFilter('commas', function (n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
});

checkData();
//end of setup


//routes
app.get('/',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        value = nunjucks.render( 'index.html' , {
            data: data.combinedData.reverse(),
            updated: scraper.updated(),
            source: wikipediaPage,
            remain:{ label:'Stay' },
            leave:{ label:'Go' },
            undecided:{ label:'Undecided' }
        });
        cache.set(req.path, value);
        checkData();
    }
    res.send(value);
});

app.get('/data.json', function (req, res) {
    res.send({
        data: data.combinedData,
        updated: scraper.updated(),
        source: wikipediaPage
    });
	let now = new Date();
	if(now.getTime() - scraper.updated().getTime() >= 60000){
		return data = scraper.updateData(wikipediaPage);
	}
});

app.get('/data.html', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        value = nunjucks.render( 'data.html' , {
            data: data.combinedData,
            updated: scraper.updated(),
            source: wikipediaPage
        });
        cache.set(req.path, value);
        checkData();
    }
    res.send(value);
});

app.get('/poll/:id/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let d = data.combinedData[data.combinedData.length - 1];
        if(req.params.id != 'latest'){
            let parts = req.params.id.split(',');
            d = data.combinedData
                .filter( e => (e.pollster == parts[0]) )
                .filter( e => (isoShortFormat(e.startDate) == parts[1]) )[0];
        }
        value = nunjucks.render( 'single-poll.svg' , layout.singlePoll(req.params.width, req.params.height, d, true) );
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value)
});

app.get('/poll-of-polls/:width-x-:height.svg',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let d = data.smoothedData[data.smoothedData.length - 1];
        value = nunjucks.render( 'single-poll.svg' , layout.singlePoll(req.params.width, req.params.height, d, true) );
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value);
});

app.get('/polls/:startdate,:enddate/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    
    if(!value){        
        let endDate = isoShortFormat.parse( req.params.enddate );
        let startDate = isoShortFormat.parse( req.params.startdate );
        let titleOverride = null;

        if(req.params.enddate === 'now'){
            endDate = new Date();
            if(req.params.startdate === 'month'){
                startDate = new Date();
                startDate.setMonth(startDate.getMonth()-1);
                titleOverride = 'Polling movement over the last month';
            }
            if(req.params.startdate === '6-months'){
                startDate = new Date();
                startDate.setMonth(startDate.getMonth()-6);
                titleOverride = 'Polling movement over the last months'
            }
            if(req.params.startdate === 'year'){
                startDate = new Date();
                startDate.setMonth(startDate.getMonth()-12);
                titleOverride = 'Polling movement over the last year'
            }
        }

        let dateRange = [ startDate, endDate ]
        let config = layout.timeSeries(req.params.width, req.params.height, dateRange, data, titleOverride);
        value = nunjucks.render( 'time-series.svg' , config );
        checkData();
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value);
});

app.get('/polls/medium-term/:width-x-:height.svg', function(req, res){
    let value = cache.get(req.path);
    if(!value){
        value = nunjucks.render( 'medium-term.svg', layout.mediumTerm(data, req.params.width, req.params.height) )
    }
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value);
});

//utility functions
function checkData(){   //for getting the latest data 
    let now = new Date();
    if(now.getTime() - scraper.updated().getTime() >= 60000){
        data = scraper.updateData(wikipediaPage);
    }
}

function onDate(a,b){ //for sorting on a date
	return b.date.getTime() - a.date.getTime();
}

const server = app.listen(process.env.PORT || 5000, function () {
	const host = server.address().address;
	const port = server.address().port;
	console.log(`running ${host} ${port}`);
});