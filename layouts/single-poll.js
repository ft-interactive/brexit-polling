'use strict'

const d3Scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');

const colour = require('./colours.js');

const isoShortFormat = d3TimeFormat.format('%Y-%m-%d');
const ftDateFormat = d3TimeFormat.format('%e %b %Y');

function singlePollLayout(width, height, data, metricEmbed){
    let small = true;
    if(height>=70) small = false;
    
	let margin = {
			top:0,
			left:0,
			bottom:27,
			right:0
		};
        
    if(small){
        margin.top = 15;
        margin.bottom = 0;
    }
    
	let scale = d3Scale.linear()
		.domain( [0, data.leave + data.remain + data.undecided] )		//we can't rely on the pollsters numbers to add up to 100 so...
		.range( [0, width - (margin.left + margin.right)] );

	let sampleString = '';

	if (data.sample) {
		sampleString = `Sample size ${data.sample}`;
	}

	let barHeight = 7;

    let footer  = small ? '' : `${data.pollster} polling from ${ftDateFormat(data.startDate)} to ${ftDateFormat(data.endDate)}. ${sampleString}`;

    if(data.pollOfPolls){
        footer = 'FT poll of polls. ' + ftDateFormat(data.date);
    }

    let plotHeight=height-(margin.top+margin.bottom);
    let plotWidth=width-(margin.left+margin.right);

	let config = {
		title:'',
        small:small,
		footer:footer,
		margin:margin,
		width:width,
		height:height,
		fontColour:colour.font,
		metricEmbed: metricEmbed,
        plotHeight:plotHeight,
        plotWidth:plotWidth,
		titleSize:'15',
		titleOffset:{
			x:0,
            y:15
		},
		valueLabelSize:Math.min(height-barHeight, 60),
        valueLabelOffset:{
            x:5,y:-barHeight*3
        },
        valueLabelColour: colour.lightFont,
		leave:{
			title:small ? 'Go - ' + data.leave + '%' : 'Go',
			width:scale(data.leave),
			height:barHeight,
			value:data.leave,
			fill:colour.leave,
            labelPosition:plotWidth-scale(data.leave)
		},
		remain:{
			title:small ? 'Stay - ' + data.remain + '%' : 'Stay',
			width:scale(data.remain),
			height:barHeight,
			value:data.remain,
			fill:colour.remain,
            labelPosition:scale(data.remain)
		},
		undecided:{
			title:small ? '' : '',
			width:scale(data.undecided),
			height:barHeight,
			value:data.undecided,
			fill:colour.undecided
		}
	};
	return config;
}

function clamp(value, extent){
    
}

module.exports = singlePollLayout;