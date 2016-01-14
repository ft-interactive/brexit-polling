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
		let time = d.date.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});
	
	let yScale = d3scale.linear()
		.domain([100,0])
		.range([0, height - (margin.top + margin.bottom)]);
		
	let xScale = d3scale.time()
		.domain( dateDomain )
		.range( [0, width - (margin.left + margin.right)] );
        
    //TODO: create X & Ys for circles on filtered data
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
		},
        xAxis:{
            ticks:[
                {
                    x:0,
                    y:0,
                    label:dateDomain[0]
                },
                {
                    x:xScale.range()[1],
                    y:0,
                    label:dateDomain[1]
                }
            ]
        },
        yAxis:{
            ruleStroke:colour.font,
            ruleStrokeWidth:2,
            ruleStrokeDashArray:"2 2",
            ticks:[
                {
                    x:0,
                    y:yScale(),
                    label:'undecided'
                },
                {
                    x:0,
                    y:yScale(),
                    label:'stay'
                },
                {
                    x:0,
                    y:yScale(),
                    label:'go'
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