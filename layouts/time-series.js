'use strict'

const d3Scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');
const d3Time = require('d3-time');
const colour = require('./colours.js');

const isoShortFormat = d3TimeFormat.format('%Y-%m-%d');
const ftDateFormat = d3TimeFormat.format('%e %b %Y');

function simpleTimeSeries(width, height, dateDomain, data, titleOverride){
    let maxPct = 75;
    let labelCenterSpacing = 15;
    
	let margin = {
		top:30,
		left:1,
		bottom:30,
		right:100
	};

	//sort data oldest to newest
	let rawData = data.combinedData.sort(function(a,b){
		return a.date.getTime() - b.date.getTime();
	}).filter(function(d){
        return (d.undecided);
    });

	let filtered = rawData.filter(function(d,i){
		let time = d.date.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});

	let smoothFiltered = data.smoothedData.filter(function(d,i){
		let time = d.date.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});
    
	let yScale = d3Scale.linear()
		.domain([maxPct,0])
		.range([0, height - (margin.top + margin.bottom)]) ;
        
	let xScale = d3Scale.time()
		.domain( dateDomain )
		.range( [0, width - (margin.left + margin.right)] );

    filtered = filtered.map(function(d){
       return {
           data:d,
           x:xScale(d.date),
           y:{
               remain:yScale(d.remain),
               leave:yScale(d.leave),
               undecided:yScale(d.undecided)
           }
       } 
    });
    
    let lastSmoothedPoint = smoothFiltered[ smoothFiltered.length-1 ]
   
    //line label positioning
    //first, don't let 'remain' and 'leave' overlap
    let labelYUndecided = yScale(lastSmoothedPoint.undecided);
    let labelYRemain = yScale(lastSmoothedPoint.remain);
    let labelYLeave = yScale(lastSmoothedPoint.leave);
    let spacing = Math.abs(labelYRemain - labelYLeave);
    if(spacing < labelCenterSpacing){
        let dy = (labelCenterSpacing - spacing) / 2;
        //move the lower down and the upper up
        if(labelYRemain > labelYLeave){
            labelYRemain += dy;
            labelYLeave -= dy;
        }else{
            labelYRemain -= dy;
            labelYLeave += dy;
        }
    } 
    
    let tickDates = dateDomain.slice(0); //clone the array
    // add years
    
    //TODO, yearly ticks
    // d3Time.timeYear.range(dateDomain[0], dateDomain[1], 1).forEach(function(d){
    //     tickDates.push(d)
    // });
    
    let primaryTicks = tickDates.map(function(d){
        return { 
            x: Math.round(xScale(d)),
            y: 0,
            label: (function(date){ return ftDateFormat(date) })(d)
        }
    });
   
	// start date, end date, two/ three? lines, (final values & positions)
	let config = {
		title: titleOverride ? titleOverride : 'Polling movements over time',
        titleSize: '20',
		footer: 'Source FT.com',
        metricEmbed: true,
		margin: margin,
		width: width,
		height: height,
		fontColour: colour.font,
		data: filtered,
        pollStyle: {
            radius: 3,
            leaveFill: colour.leave,
            undecidedFill: colour.undecidedDark,
            remainFill: colour.remain,
            fillOpacity: 0.5
        },
		line: {
			remain: {
				path: d3Shape.line()
					.x((d) => xScale(d.date) )
					.y((d) => yScale(d.remain) )
					(smoothFiltered),
				stroke:colour.remain
			},
			leave: {
				path: d3Shape.line()
					.x((d) => xScale(d.date) )
					.y((d) => yScale(d.leave) )
					(smoothFiltered),
				stroke:colour.leave
			},
			undecided: {
				path: d3Shape.line()
					.x((d) => xScale(d.date) )
					.y((d) => yScale(d.undecided) )
					(smoothFiltered),
				stroke: colour.undecidedDark
			}
		},
        xAxis: {
            ticks: primaryTicks,
            secondaryTicks: d3Time.timeMonth.range(dateDomain[0], dateDomain[1], 1).map((d) => ({ x:xScale(d), y:0 }) )
        },
        yAxis: {
            ruleStroke: colour.font,
            ruleStrokeWidth: 2,
            ruleStrokeDashArray: '2, 2',
            ticks: [
                {
                    x: xScale(lastSmoothedPoint.date),
                    fill: colour.undecidedDark,
                    y: labelYUndecided,
                    label: 'Undecided ' + Math.round(lastSmoothedPoint.undecided) +'%'
                },
                {
                    x: xScale(lastSmoothedPoint.date),
                    fill: colour.remainDark,
                    y: labelYRemain,
                    label: 'Stay ' + Math.round(lastSmoothedPoint.remain) +'%'
                },
                {
                    x: xScale(lastSmoothedPoint.date),
                    fill: colour.leaveDark,
                    y: labelYLeave,
                    label: 'Go ' + Math.round(lastSmoothedPoint.leave) +'%'
                }
            ],
            rules: [
                {
                    x1: 0,
                    y1: yScale(50),
                    x2: xScale.range()[1],
                    y2: yScale(50),
                    label: '50%'
                }
            ]
        }
	};
	
	return config;
}


module.exports = simpleTimeSeries;