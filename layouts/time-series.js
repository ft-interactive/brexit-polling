'use strict'

const d3scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');

const colour = require('./colours.js');

const isoShortFormat = d3TimeFormat.format('%Y-%m-%d');
const ftDateFormat = d3TimeFormat.format('%e %b %Y');

function simpleTimeSeries(width, height, dateDomain, data){
	let margin = {
		top:20,
		left:0,
		bottom:20,
		right:100
	};

	//sort data oldest to newest

	let rawData = data.combinedData.sort(function(a,b){
		return a.startDate.getTime() - b.startDate.getTime();
	}).filter(function(d){
        return (d.undecided);
    });

	let filtered = rawData.filter(function(d,i){
		let time = d.startDate.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});

	let smoothFiltered = data.smoothedData.filter(function(d,i){
		let time = d.date.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});

    console.log(smoothFiltered);

	let yScale = d3scale.linear()
		.domain([100,0])
		.range([0, height - (margin.top + margin.bottom)]);
        
	let xScale = d3scale.time()
		.domain( dateDomain )
		.range( [0, width - (margin.left + margin.right)] );

    //TODO: create X & Ys for circles on filtered data
    filtered = filtered.map(function(d){
       return {
           data:d,
           x:xScale(d.startDate),
           y:{
               remain:yScale(d.remain),
               leave:yScale(d.leave),
               undecided:yScale(d.undecided)
           }
       } 
    });
    
    let lastSmoothedPoint = smoothFiltered[ smoothFiltered.length-1 ]
   
	// start date, end date, two/ three? lines, (final values & positions)
	let config = {
		title:'Polling movements over time',
        titleSize:'20',
		footer:'Source FT.com',
        metricEmbed: true,
		margin:margin,
		width:width,
		height:height,
		fontColour:colour.font,
		data: filtered,
        pollStyle: {
            radius: 3,
            leaveFill:colour.leave,
            undecidedFill:colour.undecided,
            remainFill:colour.remain,
            fillOpacity:0.5
        },
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
		},
        xAxis:{
            ticks:[
                {
                    x:xScale(dateDomain[0]),
                    y:0,
                    label:ftDateFormat(dateDomain[0])
                },
                {
                    x:xScale(dateDomain[1]),
                    y:0,
                    label:ftDateFormat(dateDomain[1])
                }
            ]
        },
        yAxis:{
            ruleStroke:colour.font,
            ruleStrokeWidth:2,
            ruleStrokeDashArray:"2 2",
            ticks:[
                {
                    x:xScale(lastSmoothedPoint.date),
                    fill:colour.undecided,
                    y:yScale(lastSmoothedPoint.undecided),
                    label:'undecided ' + Math.round(lastSmoothedPoint.undecided) +'%'
                },
                {
                    x:xScale(lastSmoothedPoint.date),
                    fill:colour.remain,
                    y:yScale(lastSmoothedPoint.remain),
                    label:'stay ' + Math.round(lastSmoothedPoint.remain) +'%'
                },
                {
                    x:xScale(lastSmoothedPoint.date),
                    fill:colour.leave,
                    y:yScale(lastSmoothedPoint.leave),
                    label:'go ' + Math.round(lastSmoothedPoint.leave) +'%'
                }
            ],
            rules:[
                {
                    x1:0,
                    y1:yScale(50),
                    x2:xScale.range()[1],
                    y2:yScale(50),
                    label:''
                }
            ]
        }
	};
	
	return config;
}

module.exports = simpleTimeSeries;