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
    let dateDomain = [now, lastMonth];
    
    console.log(dateDomain);
    
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
    
    return {
        width: width,
        height: height,
        text: 'text ' + Object.keys(data).join(', ')
    };
}

module.exports = mediumTermLayout;