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
        let single = nunjucks.render( 'single-poll.svg' , layout.singlePoll(600, 75, d, true) );

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
            leave:{ label:'Leave', tint:colours.leaveTint  },
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

//graphics

app.get('/poll/:id/:width-x-:height-:background.svg', function(req,res){
    let value = cache.get(req.path);
    if(!value){
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, getDataByID( req.params.id ), true);
        chartLayout.background = '#' + req.params.background;
        value = nunjucks.render( 'single-poll.svg' ,  chartLayout);
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value)
});

app.get('/poll/:id/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, getDataByID( req.params.id ), true);
        value = nunjucks.render( 'single-poll.svg' ,  chartLayout);
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value)
});


app.get('/poll-of-polls/:width-x-:height-:background.svg',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let d = data.smoothedData[data.smoothedData.length - 1];
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, d, true);
        chartLayout.background = '#' + req.params.background;
        value = nunjucks.render( 'single-poll.svg', chartLayout );
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value);
});

app.get('/poll-of-polls/:width-x-:height.svg',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let d = data.smoothedData[data.smoothedData.length - 1];
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, d, true);
        value = nunjucks.render( 'single-poll.svg', chartLayout );
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value);
});

app.get('/polls/:startdate,:enddate/:width-x-:height-:background.svg', function (req, res) {
    let value = cache.get(req.path);
    
    if(!value){        
        let dateDomain = getDateDomain(req.params.startdate, req.params.enddate);
        let chartLayout = layout.timeSeries(req.params.width, req.params.height, dateDomain.domain, data, dateDomain.title);
        chartLayout.background = '#' + req.params.background;
        value = nunjucks.render( 'time-series.svg' , chartLayout );
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(value);
});

app.get('/polls/:startdate,:enddate/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    
    if(!value){        
        let dateDomain = getDateDomain(req.params.startdate, req.params.enddate);
        let chartLayout = layout.timeSeries(req.params.width, req.params.height, dateDomain.domain, data, dateDomain.title);
        value = nunjucks.render( 'time-series.svg' , chartLayout );
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

function getDateDomain(start, end){
    let endDate = isoShortFormat.parse( start );
    let startDate = isoShortFormat.parse( end );
    let titleOverride = null;

    if(end === 'now'){
        endDate = new Date();
        if(start === 'month'){
            startDate = new Date();
            startDate.setMonth(startDate.getMonth()-1);
            titleOverride = 'Polling over the last month';
        }
        if(start === '6-months'){
            startDate = new Date();
            startDate.setMonth(startDate.getMonth()-6);
            titleOverride = 'Polling over the last six months'
        }
        if(start === 'election-2015'){
            startDate = new Date(2015, 4, 7);
            titleOverride = 'Polling since the 2015 election'
        }
        if(start === 'year'){
            startDate = new Date();
            startDate.setMonth(startDate.getMonth()-12);
            titleOverride = 'Polling over the last year'
        }
    }
    return {
        domain:[startDate, endDate],
        title:titleOverride
    };
}

function getDataByID(id){
    let d = data.combinedData[data.combinedData.length - 1];
    if(id != 'latest'){
        let parts = id.split(',');
        d = data.combinedData
            .filter( e => (e.pollster == parts[0].replace(/-/g,'/')) )
            .filter( e => (isoShortFormat(e.date) == parts[1]) )[0];
    }
    return d;
}

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