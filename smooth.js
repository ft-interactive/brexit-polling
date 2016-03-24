'use strict';
const	d3Array = require('d3-array');


function calculateMeans(data, date){
	data = data.sort(function(a,b){return b.remain - a.remain});
	data = data.slice(Math.min(1,data.length-1),Math.min(6,data.length));
	return{
		remain: Math.round( d3Array.mean(data, (d) => d.remain ) ),
		leave: Math.round( d3Array.mean(data, (d) => d.leave ) ),
		undecided: Math.round( d3Array.mean(data, (d) => d.undecided ) ),
		date: date,
	    pollOfPolls: true
	}
}


function objectValues(o){
	let a = [];
	for(let key in o ){
		a.push(o[key]);
	}
	return a;
}

module.exports  = function (data){
	data.sort(function(a,b){
        let aDate = new Date(a.date);
        let bDate = new Date(b.date);
		return bDate.getTime() - aDate.getTime();
	});
	
	let smoothedData = []; 
	for(let i=0; i < data.length; i++){
		let end = data.slice(i, data.length-1);
		let basket = {};
		let inc = 0;
		while(Object.keys(basket).length < 8 && inc < end.length){
			let pollster = end[inc].pollster;
			if(Object.keys(basket).indexOf( pollster ) < 0){
				basket[pollster] = end[inc];
			}
			inc++;
		}
        let date = data[i].date;
        if(data[i].date){
            date = data[i].date;
        }
		smoothedData.push(calculateMeans( objectValues(basket), date) );
	}
	smoothedData.reverse();
	
	return smoothedData.filter(function(d){
		return d.undecided;
	});
}

