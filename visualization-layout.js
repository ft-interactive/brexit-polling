'use strict'

const d3scale = require('d3-scale');

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
		footer:`${data.pollster} ${data.startDate} - ${data.endDate}`,
		margin:margin,
		width:width,
		height:height,
		leave:{
			title:'Go',
			width:scale(data.leave),
			height:barHeight,
			value:data.leave,
			fill:'#F0F'
		},
		remain:{
			title:'Stay',
			width:scale(data.remain),
			height:barHeight,
			value:data.remain,
			fill:'#0F0'
		},
		undecided:{
			title:'¯\\_(ツ)_/¯',
			width:scale(data.undecided),
			height:barHeight,
			value:data.undecided,
			fill:'#BBB'
		}
	};
	return config;
}

module.exports = {
	latestPoll:latestPollLayout
};