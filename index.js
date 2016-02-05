'use strict';

const express = require('express'),
	scraper = require('./scraper.js'),
	layout = require('./layouts/index.js'),
	nunjucks = require('nunjucks'),
    lru = require('lru-cache'),
    d3TimeFormat = require('d3-time-format').format,
	isoShortFormat = d3TimeFormat('%Y-%m-%d'),
    ftDateFormat = d3TimeFormat('%e %b %Y'),
    colours = require('./layouts/colours.js'),
    request = require('request');

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
})
.addFilter('boldIfRemain', function (poll) {
    if(poll.remain >= poll.leave) return 'lead';
    return '';
}).addFilter('boldIfLeave', function (poll) {
    if(poll.remain <= poll.leave) return 'lead';
    return '';
}).addFilter('urlFragmentSanitize', function(fragment){
    return fragment.replace(/\//g,'-');
});

checkData();
//end of setup


//routes
app.get('/',function(req, res){
    let value = cache.get(req.path);
    if(!value){

        let d = data.smoothedData[data.smoothedData.length - 1];
        let single = nunjucks.render( 'single-poll.svg' , layout.singlePoll(600, 85, d, true) );

        let endDate = new Date();
        let startDate = new Date();
        startDate.setYear( endDate.getFullYear()-1);
        let timeSeriesLayout = layout.timeSeries(600, 400, [startDate, endDate], data, 'Polling movement over the last year');
        let timeSeries = nunjucks.render( 'time-series.svg',  timeSeriesLayout);

        value = nunjucks.render( 'index.html' , {
            title: 'Brexit poll tracker',
            data: data.combinedData.reverse(),
            updated: scraper.updated(),
            source: wikipediaPage,
            remain:{ label:'Stay', tint:colours.remainTint },
            leave:{ label:'Go', tint:colours.leaveTint  },
            undecided:{ label:'Undecided' },
            timeChart:timeSeries,
            singleChart:single
        });
        cache.set(req.path, value);
        checkData();
    }
    res.send(value);
});

app.get('/card',function(req, res){
    request('http://ig.ft.com/sites/2016/brexit-card/', function (error, response, body) {
        res.send(body);
    });
});

app.get('/data.json', function (req, res) {
    let value = cache.get(req.path);
    if (!value){
        value = {
            data: data.combinedData,
            updated: scraper.updated(),
            source: wikipediaPage
        }
        cache.set(req.path, value);
        checkData();
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.send(value);
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
                .filter( e => (e.pollster == parts[0].replace(/-/g,'/')) )
                .filter( e => (isoShortFormat(e.date) == parts[1]) )[0];
        }
        value = nunjucks.render( 'single-poll.svg' , layout.singlePoll(req.params.width, req.params.height, d, true) );
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
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
    res.setHeader('Access-Control-Allow-Origin', '*');
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

        let dateRange = [ startDate, endDate ];
        let config = layout.timeSeries(req.params.width, req.params.height, dateRange, data, titleOverride);
        value = nunjucks.render( 'time-series.svg' , config );
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value);
});

app.get('/polls/medium-term/:width-x-:height.svg', function(req, res){
    let value = cache.get(req.path);
    if(!value){
        value = nunjucks.render( 'medium-term.svg', layout.mediumTerm(data, req.params.width, req.params.height) )
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
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