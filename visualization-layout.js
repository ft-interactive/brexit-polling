
'use strict'

const d3scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');

const colour = {
	remain:'#8897ba', //'#d66d06',
	leave:'#8eadab', //'#819e9a',//'#458b00',//'#2e6e9e',
	undecided:'#e9decf',//'#e9decf',//'#cec69b',
	ftPink:'#fff1e0',
	font:'#333'
};

const isoShortFormat = d3TimeFormat.format('%Y-%m-%d');
const ftDateFormat = d3TimeFormat.format('%e %b %Y');

function simpleTimeSeries(width, height, dateDomain, data){
	let margin = {
		top:20,
		left:0,
		bottom:20,
		right:0
	};

	//sort data oldest to newest
	
	data = data.sort(function(a,b){
		return a.startDate.getTime() - b.startDate.getTime();
	});
	
	let smoothedData = []; 
	for(let i=0; i < data.length; i++){
		let slice = data.slice(Math.max(0, i-7), i);
		smoothedData.push({
			remain: d3Array.mean(slice, (d) => d.remain ),
			leave: d3Array.mean(slice, (d) => d.leave ),
			undecided: d3Array.mean(slice, (d) => d.undecided ),
			date: data[i].startDate
		});
	}
	
	let filtered = data.filter(function(d,i){
		let time = d.startDate.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});
	
	let smoothFiltered = smoothedData.filter(function(d,i){
		console.log(d);
		let time = d.date.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});
	
	let yScale = d3scale.linear()
		.domain([100,0])
		.range([0, height - (margin.top + margin.bottom)]);
		
	let xScale = d3scale.time()
		.domain( dateDomain )
		.range( [0, width - (margin.left + margin.right)] );
	// start date, end date, two/ three? lines, (final values & positions)
	let config = {
		title:'',
		footer:'Source FT.com',
		margin:margin,
		width:width,
		height:height,
		fontColour:colour.font,
		data: filtered,
		line: {
			remain: {
				path:d3Shape.line()
					.x((d) => xScale(d.date) )
					.y((d) => yScale(d.remain) )
					(smoothFiltered),
				stroke:colour.remain
			},	
			leave: {
				path:d3Shape.line()
					.x((d) => xScale(d.date) )
					.y((d) => yScale(d.leave) )
					(smoothFiltered),
				stroke:colour.leave
			},
			undecided: {
				path:d3Shape.line()
					.x((d) => xScale(d.date) )
					.y((d) => yScale(d.undecided) )
					(smoothFiltered),
				stroke:colour.undecided
			}
		}
	};
	
	return config;
}


function singlePollLayout(width, height, data, metricEmbed){
	let margin = {
			top:20,
			left:0,
			bottom:20,
			right:0
		};

	let scale = d3scale.linear()
		.domain( [0, data.leave + data.remain + data.undecided] )		//we can't rely on the pollsters numbers to add up to 100 so...
		.range( [0, width - (margin.left + margin.right)] );

	let sampleString = '';

	if (data.sample) {
		sampleString = `Sample size ${data.sample}`;
	}

	let barHeight = height - (margin.top + margin.bottom);

	let config = {
		title:'',
		footer:`${data.pollster} polling from ${ftDateFormat(data.startDate)} to ${ftDateFormat(data.endDate)}. ${sampleString}`,
		margin:margin,
		width:width,
		height:height,
		fontColour:colour.font,
		metricEmbed: metricEmbed,
		titleSize:'17',
		titleOffset:{
			x:0,y:-5
		},
		valueLabelSize:Math.min(barHeight, 60),
        valueLabelOffset:{
            x:10,y:-10
        },
		leave:{
			title:'Go',
			width:scale(data.leave),
			height:barHeight,
			value:data.leave,
			fill:colour.leave
		},
		remain:{
			title:'Stay',
			width:scale(data.remain),
			height:barHeight,
			value:data.remain,
			fill:colour.remain
		},
		undecided:{
			title:'¯\\_(ツ)_/¯',
			width:scale(data.undecided),
			height:barHeight,
			value:data.undecided,
			fill:colour.undecided
		}
	};
	return config;
}

module.exports = {
	singlePoll:singlePollLayout,
	timeSeries:simpleTimeSeries
};