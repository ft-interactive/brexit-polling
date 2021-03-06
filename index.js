'use strict';

const express = require('express'),
    bertha = require('./bertha.js'),
    moreStories = require('./more-stories.js'),
    externalContent = require('./external-content.js'),
	layout = require('./layouts/index.js'),
	nunjucks = require('nunjucks'),
    lru = require('lru-cache'),
    d3TimeFormat = require('d3-time-format').format,
	isoShortFormat = d3TimeFormat('%Y-%m-%d'),
    ftDateFormat = d3TimeFormat('%b %e, %Y'),
    colours = require('./layouts/colours.js'),
    request = require('request');

const storyPage = 'https://ft-ig-stream-content.herokuapp.com/metacard/data.json';
const maxAge = 120; // for user agent caching purposes
let data = [];
let story = '';

const cache = lru({
    max: 500,
    maxAge: 60*1000 // 60 seconds
});

const app = express();
app.set('trust proxy', true);

nunjucks.configure('views', {
    autoescape: true,
    express: app
})
.addFilter('isoShortFormat',isoShortFormat)
.addFilter('ftDateFormat',ftDateFormat)
.addFilter('replaceNaN', function(n){
    if(n=='NaN' || n==null || isNaN(n)){
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


// ROUTES
app.get('/__access_metadata', function(req, res){
    let value = cache.get(req.path);
    if(!value){
        value = JSON.parse(nunjucks.render('access_metadata.json'));
        cache.set(req.path, value);
    }
    res.send(value);
});

app.get('/__gtg', function(req, res){
    res.send('ok');
});

app.get('/', function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let latest = story.data;
        let d = pollOfPolls();
        let endDate = new Date(2016,5,23);
        let startDate = new Date(2015,8,1);
        // startDate.setYear( endDate.getFullYear()-1);
        let timeSeriesLayout = layout.timeSeries(600, 400, [startDate, endDate], data, 'Polling movement since September 2015', false);
        timeSeriesLayout.differentiateOnline = true;

        if(timeSeriesLayout.error){
            console.log(timeSeriesLayout.error, startDate, endDate);
            d.nocache = true;
        }
        let pollLayout = layout.singlePoll(600, 75, d, false);

        value = nunjucks.render( 'index.html' , {
            title: 'EU referendum poll of polls',
            headline: 'Brexit poll tracker',
            data: data.combinedData.reverse(),
            updated: bertha.updated(),
            source: 'FT Research',
            remain:{ label:'Remain', tint:colours.remainTint },
            leave:{ label:'Leave', tint:colours.leaveTint  },
            undecided:{ label:'Undecided' },
            timeChart:nunjucks.render( 'time-series.svg',  timeSeriesLayout),
            singleChart: nunjucks.render( 'single-poll.svg',  pollLayout),
            storyList: nunjucks.render( 'story-list.html', { stories:moreStories.getData() } ),
            latest: latest
        });
        if(!d.nocache){
            cache.set(req.path, value)
        }else{
            bertha.invalidate();
        }
        checkData();
    }
    res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
    res.send(value);
});

app.get('/card',function(req, res){
    request('http://ig.ft.com/sites/2016/brexit-card/', function (error, response, body) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
        res.send(body);
    });
});

app.get('/data.json', function (req, res) {
    let value = cache.get(req.path);
    if (!value){
        value = data;
        // value = {
        //     data: data.combinedData,
        //     updated: bertha.updated(),
        //     source: 'FT research'
        // };
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
    res.send(value);
});

app.get('/data.html', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        value = nunjucks.render( 'data.html' , {
            data: data.combinedData,
            updated: bertha.updated(),
            source: 'FT Research'
        });
        cache.set(req.path, value);
        checkData();
    }
    res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
    res.send(value);
});

//graphics
//SINGLE POLL
app.get('/poll/fontless/:id/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, getDataByID( req.params.id ), false);
        value = nunjucks.render( 'single-poll.svg' ,  chartLayout);
        cache.set(req.path, value);
        checkData();
    }
    setSVGHeaders(res).send(value)
});

app.get('/poll/:id/:width-x-:height-:background.svg', function(req,res){
    let value = cache.get(req.path);
    if(!value){
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, getDataByID( req.params.id ), true);
        chartLayout.background = '#' + req.params.background;
        value = nunjucks.render( 'single-poll.svg' ,  chartLayout);
        cache.set(req.path, value);
        checkData();
    }
    setSVGHeaders(res).send(value)
});

app.get('/poll/:id/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, getDataByID( req.params.id ), true);
        value = nunjucks.render( 'single-poll.svg' ,  chartLayout);
        cache.set(req.path, value);
        checkData();
    }
    setSVGHeaders(res).send(value)
});

//POLL OF POLLS

// poll of polls - multiple svgs in one response
app.get('/poll-of-polls/multiple/:sizes.json',function(req, res){
    let value = cache.get(req.path);
    if (!value) {
        const sizes = req.params.sizes.split('_').map(string => string.split('-x-'));

        const d = pollOfPolls();

        value = [];
        for (const size of sizes) {
            const chartLayout = layout.singlePoll(size[0], size[1], d, false);
            value.push(nunjucks.render( 'single-poll.svg', chartLayout ));
        }
        value = JSON.stringify(value);

        if (!d.nocache) {
            cache.set(req.path, value);
        } else {
            bertha.invalidate();
        }
        checkData();

    }
    setJSONHeaders(res).send(value);
});

app.get('/poll-of-polls/fontless/:width-x-:height.svg',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let d = pollOfPolls();
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, d, false);
        value = nunjucks.render( 'single-poll.svg', chartLayout );
        if(!d.nocache){
            cache.set(req.path, value);
        }else{
            bertha.invalidate();
        }
        checkData();
    }
    setSVGHeaders(res).send(value);
});

app.get('/poll-of-polls/:width-x-:height-:background.svg',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let d = pollOfPolls();
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, d, true);
        chartLayout.background = '#' + req.params.background;
        value = nunjucks.render( 'single-poll.svg', chartLayout );
        if(!d.nocache){
            cache.set(req.path, value);
        }else{
            bertha.invalidate();
        }
        checkData();
    }
    setSVGHeaders(res).send(value);
});

app.get('/poll-of-polls/:width-x-:height.svg',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let d = pollOfPolls();
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, d, true);
        value = nunjucks.render( 'single-poll.svg', chartLayout );
        if(!d.nocache){
            cache.set(req.path, value);
        }else{
            bertha.invalidate();
        }
        checkData();
    }
    setSVGHeaders(res).send(value);
});

app.get('/poll-of-polls/:date/:width-x-:height.svg',function(req, res){
    let value = cache.get(req.path);
    if(!value){
        let d = pollOfPolls( req.params.date );
        let chartLayout = layout.singlePoll(req.params.width, req.params.height, d, true);
        value = nunjucks.render( 'single-poll.svg', chartLayout );
        if(!d.nocache){
            cache.set(req.path, value);
        }else{
            bertha.invalidate();
        }
        checkData();
    }
    setSVGHeaders(res).send(value);
});

//TIME SERIES

app.get('/polls/fontless/:startdate,:enddate/:width-x-:height-:background.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let dateDomain = [new Date(2015,8,1), new Date(2016,5,23)];
        let chartLayout = layout.timeSeries(req.params.width, req.params.height, dateDomain.domain, data, dateDomain.title, false);
        chartLayout.background = '#' + req.params.background;
        value = nunjucks.render( 'time-series.svg' , chartLayout );
        checkData();
    }
    setSVGHeaders(res).send(value);
});

app.get('/polls/fontless/:startdate,:enddate/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let dateDomain = [new Date(2015,8,1), new Date(2016,5,23)];
        let chartLayout = layout.timeSeries(req.params.width, req.params.height, dateDomain.domain, data, dateDomain.title, false);
        value = nunjucks.render( 'time-series.svg' , chartLayout );
        checkData();
    }
    setSVGHeaders(res).send(value);
});

app.get('/polls/:startdate,:enddate/:width-x-:height-:background.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let dateDomain = [new Date(2015,8,1), new Date(2016,5,23)];
        let chartLayout = layout.timeSeries(req.params.width, req.params.height, dateDomain.domain, data, dateDomain.title, true);
        chartLayout.background = '#' + req.params.background;
        value = nunjucks.render( 'time-series.svg' , chartLayout );
        checkData();
    }
    setSVGHeaders(res).send(value);
});

app.get('/polls/:startdate,:enddate/:width-x-:height.svg', function (req, res) {
    let value = cache.get(req.path);
    if(!value){
        let dateDomain = [new Date(2015,8,1), new Date(2016,5,23)];
        let chartLayout = layout.timeSeries(req.params.width, req.params.height, dateDomain.domain, data, dateDomain.title, true);
        value = nunjucks.render( 'time-series.svg' , chartLayout );
        checkData();
    }
    setSVGHeaders(res).send(value);
});

// END ROUTES

//utility functions

function pollOfPolls(date){
        let d = {};
        if(Array.isArray(data.smoothedData)){
            d = data.smoothedData[Math.max(data.smoothedData.length - 1, 0)];
            if(date){
                let polls = data.smoothedData.filter(function(p){ return isoShortFormat(p.date) == date });
                if(polls.length >=1) d = polls[0];
            }
        }else{
            console.log('smoothedData is not an array')
            d.nocache = true;
        }
        return d;
}

function setSVGHeaders(res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
    return res;
}

function setJSONHeaders(res){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
    return res;
}

function getDateDomain(start, end){
    let endDate = isoShortFormat.parse( end );
    let startDate = isoShortFormat.parse( start );
    let titleOverride = null;

    if(end === 'now'){
        endDate = new Date(2016,5,23);
        if(start === 'month'){
            startDate = new Date();
            startDate.setMonth(startDate.getMonth()-1);
            titleOverride = 'Polling over the past month';
        }
        if(start === '6-months'){
            startDate = new Date();
            startDate.setMonth(startDate.getMonth()-6);
            titleOverride = 'Polling over the past six months'
        }
        if(start === 'election-2015'){
            startDate = new Date(2015, 4, 7);
            titleOverride = 'Polling since the 2015 election'
        }
        if(start === 'year'){
            startDate = new Date();
            startDate.setMonth(startDate.getMonth()-12);
            titleOverride = 'Polling over the past year'
        }
    }

    if(end === 'referendum'){
        endDate = new Date(2016, 5, 23);
        if(start === '6-months'){
            startDate = new Date();
            startDate.setMonth(endDate.getMonth()-6);
            titleOverride = 'Polling over the six months before the referendum'
        }
        if(start === 'election-2015'){
            startDate = new Date(2015, 4, 7);
            titleOverride = 'Polling since the 2015 election'
        }
        if(start === 'year'){
            startDate = new Date();
            startDate.setMonth(endDate.getMonth()-12);
            titleOverride = 'Polling over the year before the referendum'
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
    if(now.getTime() - bertha.updated().getTime() >= 60000){
        data = bertha.updateData();
    }
    if(now.getTime() - externalContent.updated().getTime() >= 60000){
        story = externalContent.updateData(storyPage);
    }
    if(now.getTime() - moreStories.updated().getTime() >= 60000 || moreStories.getData().length == 0){
        moreStories.updateData();
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
