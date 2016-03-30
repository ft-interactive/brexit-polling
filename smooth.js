'use strict';
const	d3Array = require('d3-array');


function calculateMeans(data, date){
	// data.forEach(function(d,i){
	// 	d.daysSince = Math.round((new Date - d.date)/(1000*60*60*24));
	// 	d.weight = 100*Math.pow((1-0.1423041),d.daysSince);
	// })
	data = data.sort(function(a,b){return b.remain - a.remain});
	data = data.slice(Math.min(1,data.length-1),Math.min(6,data.length));
	data = data.sort(function(a,b){return b.date - a.date});
	data.forEach(function(d,i){
		d.daysSince = Math.round((data[0].date - d.date)/(1000*60*60*24));
		d.weight = 100/(Math.pow(d.daysSince+1,0.25));
		d.remainW = d.remain*d.weight;
		d.leaveW = d.leave*d.weight;
		d.undecidedW = d.undecided*d.weight;
	});
	// console.log(d3Array.sum(data, (d) => d.remainW) / d3Array.sum(data, (d) => d.weight));
	// return{
	// 	remain: Math.round( d3Array.mean(data, (d) => d.remain ) ),
	// 	leave: Math.round( d3Array.mean(data, (d) => d.leave ) ),
	// 	undecided: Math.round( d3Array.mean(data, (d) => d.undecided ) ),
	// 	date: date,
	// 	method: data[0].method,
	//     pollOfPolls: true
	// }
	return{
		remain: Math.round( d3Array.sum(data, (d) => d.remainW) / d3Array.sum(data, (d) => d.weight) ),
		leave: Math.round( d3Array.sum(data, (d) => d.leaveW) / d3Array.sum(data, (d) => d.weight) ),
		undecided: Math.round( d3Array.sum(data, (d) => d.undecidedW) / d3Array.sum(data, (d) => d.weight) ),
		date: date,
		method: data[0].method,
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
	for(let i=0; i < data.length-1; i++){
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

