'use strict'

const d3Scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');

const colour = require('./colours.js');

const isoShortFormat = d3TimeFormat.format('%Y-%m-%d');
const ftDateFormat = d3TimeFormat.format('%b %e, %Y');
const ftTruncatedDateFormat = d3TimeFormat.format('%e %b');

function singlePollLayout(width, height, data, metricEmbed){
    let small = true;
	let narrow = true;
    if(height >= 70) small = false;
	if(width >= 300) narrow = false;
		    
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
		sampleString = `Sample ${Number(data.sample).toLocaleString()}`;
	}

	let barHeight = 7;

    let footer = '';
	data.date = new Date(data.date);
    if(data.pollOfPolls){
        footer = small ? '' : 'FT poll of polls, updated ' + ftDateFormat(data.date);
    }else{
		footer = small ? '' : `${data.pollster}. ${ftDateFormat(data.date)}. ${sampleString}`;
	}

    let plotHeight = height-(margin.top+margin.bottom);
    let plotWidth = width-(margin.left+margin.right);
    let labelBuffer = 130;
    
	console.log(narrow);
	let remainValuePosition = narrow ? 5 : Math.max( scale(data.remain), labelBuffer );
	let leaveValuePosition = narrow ? width-5 : Math.min((plotWidth-scale(data.leave)), (plotWidth-labelBuffer));
	let leaveValueAnchor = narrow ? 'end' : 'start';
	let remainValueAnchor = narrow ? 'start' : 'end';
	
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
		valueLabelSize: Math.min(plotHeight, 60),
        valueLabelOffset:{
            x:5,y:-19
        },
        valueLabelColour: colour.lightFont,
		leave:{
			title:small ? 'Leave - ' + data.leave + '%' : 'Leave',
			width:scale(data.leave),
			height:barHeight,
			value:data.leave,
			fill:colour.leave,
			fontFill:colour.leaveDark,
            labelPosition:leaveValuePosition,
			anchor:leaveValueAnchor,
		},
		remain:{
			title:small ? 'Remain - ' + data.remain + '%' : 'Remain',
			width:scale(data.remain),
			height:barHeight,
			value:data.remain,
			fill:colour.remain,
			fontFill:colour.remainDark,
            labelPosition:remainValuePosition,
			anchor:remainValueAnchor,
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