'use strict'

const d3Scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');
const colour = require('./colours.js');


function mediumTermLayout(data, width, height){
    let now = new Date();
    let lastMonth = new Date();
    lastMonth.setMonth( now.getMonth()-1 );
    let dateDomain = [lastMonth, now];
    
    console.log(dateDomain);
    
    //sort and filter
    let rawData = data.combinedData.sort(function(a,b){
		return a.date.getTime() - b.date.getTime();
	}).filter(function(d){
        return (d.undecided);
    });

	let filtered = rawData.filter(function(d,i){
		let time = d.date.getTime();
        console.log(dateDomain[1])
        console.log (d.date , ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() ))
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});

	let smoothFiltered = data.smoothedData.filter(function(d,i){
		let time = d.date.getTime();
		return ( time <= dateDomain[1].getTime() && time >= dateDomain[0].getTime() );
	});
    
    
    let margin = {
        top:10,
        bottom:10,
        left:10,
        right:10  
    };
    
    
    var yScale = d3Scale.time()
		.domain( dateDomain )
		.range( [0, height - (margin.top + margin.bottom)] );
    
    var xScale = d3Scale.linear()
        .domain( [0, 100] )
        .range( [0, width - (margin.left + margin.right) ] );
        
    filtered = filtered.map(function(d){
        return {
            remainX:0,
            remainWidth:xScale(d.remain),
            leaveX:xScale(d.remain) + xScale(d.undecided),
            leaveWidth:xScale(d.leave),
            y:yScale(d.date),
            data:d
        }
    })
    
    return {
        width: width,
        height: height,
        margin: margin,
        barHeight:10,
        text: 'text ' + Object.keys(data).join(', '),
        data: filtered
    };
}

module.exports = mediumTermLayout;