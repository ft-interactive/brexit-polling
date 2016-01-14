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


function singlePollLayout(width, height, data, metricEmbed){
    let small = true;
    if(height>=90) small = false;
    
	let margin = {
			top:20,
			left:0,
			bottom:20,
			right:0
		};
        
    if(small){
        margin.top = 15;
        margin.bottom = 0;
    }

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
        small:small,
		footer:small ? '' : `${data.pollster} polling from ${ftDateFormat(data.startDate)} to ${ftDateFormat(data.endDate)}. ${sampleString}`,
		margin:margin,
		width:width,
		height:height,
		fontColour:colour.font,
		metricEmbed: metricEmbed,
		titleSize:'14',
		titleOffset:{
			x:0,
            y:small ? -3 : -5
		},
		valueLabelSize:Math.min(barHeight, 60),
        valueLabelOffset:{
            x:10,y:-10
        },
		leave:{
			title:small ? 'Go - ' + data.leave + '%' : 'Go',
			width:scale(data.leave),
			height:barHeight,
			value:data.leave,
			fill:colour.leave
		},
		remain:{
			title:small ? 'Stay - ' + data.remain + '%' : 'Stay',
			width:scale(data.remain),
			height:barHeight,
			value:data.remain,
			fill:colour.remain
		},
		undecided:{
			title:small ? '' : '¯\\_(ツ)_/¯',
			width:scale(data.undecided),
			height:barHeight,
			value:data.undecided,
			fill:colour.undecided
		}
	};
	return config;
}

module.exports = singlePollLayout;