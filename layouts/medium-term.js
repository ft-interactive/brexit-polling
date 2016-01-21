'use strict'

const d3scale = require('d3-scale');
const d3TimeFormat = require('d3-time-format');
const d3Array = require('d3-array');
const d3Shape = require('d3-shape');
const colour = require('./colours.js');


function mediumTermLayout(data, width, height){
    
    return {
        width: width,
        height: height,
        text: 'text' + Object.keys(data)
    }
}

module.exports = mediumTermLayout;