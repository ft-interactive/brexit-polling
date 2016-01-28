'use strict'

const d3Scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');
const colour = require('./colours.js');
const ftDateFormat = d3TimeFormat.format('%e %b %Y');

function mediumTermLayout(data, width, height){
    let now = new Date();
    let lastMonth = new Date();
    lastMonth.setMonth( now.getMonth()-1 );
    let dateDomain = [lastMonth, now];
    
    //sort and filter
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
        
    let margin = {
        top:100,
        bottom:10,
        left:0,
        right:0  
    };
    
    var yScale = d3Scale.time()
		.domain( dateDomain )
		.range( [height - (margin.top + margin.bottom), 0] );
    
    var xScale = d3Scale.linear()
        .domain( [0, 100] )
        .range( [0, width - (margin.left + margin.right) ] );
        
    filtered = filtered.map(function(d){
        return {
            remainX:0,
            remainWidth:xScale(d.remain),
            leaveX:(width-(margin.left+margin.right)) - xScale(d.leave),
            leaveWidth:xScale(d.leave),
            y:yScale(d.date),
            date:ftDateFormat(d.date),
            data:d
        }
    });
    
    
    let hTicks = dateArray(dateDomain).map(function(d){
            if(d.getDate() == 1){
                return {
                    value:yScale(d),
                    label:ftDateFormat(d),
                    major:true
                }
            }
            return {
                value: yScale(d),
                label: d.getDate(),
                major: false
            }
        });
    console.log(hTicks);
    return {
        metricEmbed:true,
        width: width,
        height: height,
        margin: margin,
        barHeight:7,
        text: 'text ' + Object.keys(data).join(', '),
        data: filtered,
        remainFill:colour.remain,
        leaveFill:colour.leave,
        verticalTicks:[
            {value:Math.round(xScale(25)), label:'25%'},
           // {value:Math.round(xScale(50)), label:'50%'},
            {value:Math.round(xScale(75)), label:'25%'}
        ],
        horizontalTicks:hTicks
    };
}

function dateArray(domain){
    let current = domain[0];
    let dates = [];
    while(current.getTime() <= domain[1].getTime()){
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

module.exports = mediumTermLayout;