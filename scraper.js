'use strict';
const	request = require('request');
const	cheerio = require('cheerio');
const	csv = require('d3-dsv').csv;

const tableKeys = [
	'national-2015',
	'national-2014',
	'national-2013',
	'national-2012',
	'national-2011',
	'national-2010'
];

let updated = null;


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
						return clean(d, year); 
					})
					.filter(function(d){ return d; }); //filter out nulls
			});
			
			data.combinedData = tableKeys.reduce(function(previousValue, currentValue){
				return previousValue.concat( data[currentValue] );
			},[]);
			
			updated = new Date();
		})
		.catch(function(reason){
			console.log('Failed to get ' + pageURL, reason);
		});
		
	return data;
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
	//if there's no remain % then return null
	let remain = 'Remain';
	let leave = 'Leave';
	let undecided = 'Undecided';
	let pollster = 'Conducted by';
	if(!datum[remain]) remain = 'stay';
	if(!datum[leave]) leave = 'leave';
	if(!datum[undecided]) undecided = 'Unsure';
	if(!datum[pollster]) pollster = 'Held by';


	if(datum[remain].indexOf('%')<0) return null;

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

	return {
		'startDate':startDate,
		'endDate':endDate,
		'remain':Number(datum[remain].replace('%','')),
		'leave':Number(datum[leave].replace('%','')),
		'undecided':Number(datum[undecided].replace('%','')),
		'sample':Number(datum['Sample'].replace(/,/g,'')),
		'pollster':datum[pollster],
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