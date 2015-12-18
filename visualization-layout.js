
'use strict'

const d3scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');

const colour = {
	remain:'#d66d06',
	leave:'#819e9a',//'#458b00',//'#2e6e9e',
	undecided:'#e9decf',//'#cec69b',
	ftPink:'#fff1e0',
	font:'#333'
};

function reformatDate(dateString){
	let isoShortFormat = d3TimeFormat.format('%Y-%m-%d');
	let ftDateFormat = d3TimeFormat.format('%e %b %Y');
	return ftDateFormat( isoShortFormat.parse( dateString ) );
}


function latestPollLayout(width, height, data){
	let margin = {
			top:20,
			left:0,
			bottom:20,
			right:0
		};
		
	let scale = d3scale.linear()
		.domain([0,100])
		.range([0, width - (margin.left + margin.right)]);
		
	let barHeight = height - (margin.top + margin.bottom);
	let config = {
		title:'',
		footer:`${data.pollster} polling from ${reformatDate(data.startDate)} to ${reformatDate(data.endDate)}. Sample size ${data.sample}`,
		margin:margin,
		width:width,
		height:height,
		fontColour:colour.font,
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
	latestPoll:latestPollLayout
};