'use strict';
const	request = require('request');
const	cheerio = require('cheerio');
const	csv = require('d3-dsv').csv;
const   failsafe = require('./failsafe.js');
const	d3Array = require('d3-array');

failsafe.data = failsafe.data.map(function(d){
    d.startDate = new Date(d.startDate);
    d.endDate = new Date(d.endDate);
    return d;
})

var backupData = {
    combinedData: failsafe.data,
    smoothedData: smooth(failsafe.data),
    updated: failsafe.updated
}

const tableKeys = [ //need one of these for each table in the page
    'national-2016',
	'national-2015',
	'national-2014',
	'national-2013',
	'national-2012',
	'national-2011',
	'national-2010'
];

let updated = new Date(2015,0,1);


function updateData(pageURL){
	let data = {};
	console.log('updating...', pageURL);
	getPage(pageURL)
		.then(function(page){
			let tables = cheerio.load(page)('table')
	
			tables.each(function(i,t){
				if( i>=tableKeys.length ) return;

				let tableArray = parseTable(t);
				let year = Number(tableKeys[i].split('-')[1]);
				
				data[ tableKeys[i] ] = csv.parse( csv.formatRows(tableArray) )
					.map(function(d){
						var cleaned = clean(d, year);
						return cleaned; 
					})
					.filter(function(d){ return d; }); //filter out nulls
			});
			
			data.combinedData = tableKeys.reduce(function(previousValue, currentValue){
				return previousValue.concat( data[currentValue] );
			},[]);

			if( data.combinedData.length < backupData.combinedData.length ){ //if there's less data than there used to be there's probably been a chnage to the wikipedia page layout/ format
                console.error('ERROR: data length less than failsafe ' + data.combinedData.length + ' ' + new Date()); //logentries pattern 'ERROR: data length less than failsafe'        
                data.combinedData = backupData.combinedData;
	            data.updated = backupData.updated;
				data.smoothedData = smooth(data.combinedData);
            }else{
                data.smoothedData = smooth(data.combinedData);
                console.log('set backup data')
                backupData = data;
            }
			updated = new Date();
           //
		})
		.catch(function(reason){
			console.error('ERROR: Failed to get ' + pageURL + ' - ' + reason + ' ' + new Date()); //logentries pattern 'ERROR: Failed to get'
            data.combinedData = backupData.combinedData;
            data.updated = backupData.updated;
			data.smoothedData = smooth(data.combinedData);
		});

    
	return data;
}

function smooth(data){
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

function objectValues(o){
	let a = [];
	for(let key in o ){
		a.push(o[key]);
	}
	return a;
}

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

//	EXAMPLE MESS:
	// "Date(s) conducted": "4–6 Dec",
	// "Remain": "43%",
	// "Leave": "39%",
	// "Undecided": "17%",
	// "Sample": "2,022",
	// "Conducted by": "ICM",
	// "Notes": ""
	//format the date 
	//get rid of percentage signs and commas

function clean(datum, year){ //need to pass in the year as this isn't always in the date :()
	

	let remain = 'Remain';
	let leave = 'Leave';
	let undecided = 'Undecided';
	let pollster = 'Conducted by';
	if(!datum[remain]) remain = 'remain';
	if(!datum[leave]) leave = 'leave';
	if(!datum[undecided]) undecided = 'Unsure';
	if(!datum[pollster]) pollster = 'Held by';


	if(datum[remain].indexOf('%') < 0) return null; //if there's no remain % then return null

	let longMonths = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ];
	let shortMonths = [ 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec' ];
	let monthNumbers = [];
	let startDate = '';
	let endDate = '';
	let date = datum['Date(s) conducted'];
	date = date.toLowerCase();

	//replace month names with numbers
	longMonths.forEach(function(s,i){
		if(date.indexOf(s) > -1){
			monthNumbers.push((i+1));
			date = date.replace(s, (i+1));
		}
	});

	shortMonths.forEach(function(s,i){
		if(date.indexOf(s) > -1){
			monthNumbers.push((i+1));
			date = date.replace(s, (i+1));
		}
	});

	//if there's a hyphen we have a range
	var range = date.split('–'); //NOTE: of course the character in question is not actually a hyphen :(

	range.forEach(function(s,i){
		//if there's more than one month number use the appropriate one, otherwise use the first(only) one
		let month = 0;
		if(monthNumbers.length === 1){ 
			month = monthNumbers[0]; 
		}else{
			month = monthNumbers[i];
		}
		let day = Number(s.split(' ')[0]);

		if(i===0){
			startDate = new Date(year, month-1, day);
		}else{
			endDate = new Date(year, month-1, day);
		}
	});
    let canonicalDate = startDate;
    if(endDate){
        canonicalDate = endDate;
    }

	return {
        'date':canonicalDate,
		'startDate':startDate,
		'endDate':endDate,
		'remain':Number(datum[remain].replace('%','')),
		'leave':Number(datum[leave].replace('%','')),
		'undecided':Number(datum[undecided].replace('%','')),
		'sample':Number(datum['Sample'].replace(/,/g,'')),
		'pollster':datum[pollster].replace(/\[.*\]/g,''),
		'notes':datum["Notes"]
	};
}

function getPage(url) {
	return new Promise(
		function (resolve, reject) {
			request(url, function (error, response, body) {
				if (!error && response.statusCode == 200) {
					resolve( body );
				}else{
					reject(' REJECTED ' + error);
				}
			})
		});
}

function parseTable(table){
	const out = [];
	
	cheerio.load(table)('tr')
		.each( function(j, row){
			const rowArray = [];
			
			cheerio(row).find('th, td').each(function(k, cell){
				rowArray.push( (cheerio(cell).text().replace(/(\n)+/g,' ').trim()));
			});

			out.push(rowArray);
		});

	return out;
}

module.exports = {
	updateData:updateData,
	updated:function(){
		return updated
	},
	tableKeys:tableKeys
};