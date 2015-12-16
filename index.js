'use strict';

const express = require('express'),
	request = require('request'),
	cheerio = require('cheerio'),
	csv = require('d3-dsv').csv,
	wikipediaPage = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_United_Kingdom_European_Union_membership_referendum';

const tableKeys = [
	'national-2015',
	'national-2014',
	'national-2013',
	'national-2012',
	'national-2011',
	'national-2010'
];


const app = express();
let data = updateData(wikipediaPage);
let updated = null;

function updateData(pageURL){
	let data = {};
	console.log('updating...');
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
			updated = new Date();
			console.log('updated', updated);
		})
		.catch(function(reason){
			console.log('Failed :( ', reason);
		});

	return data;
}

app.get('/brexit/:data.:format', function (req, res) {
	res.send( {
		data:data[req.params.data],
		updated:updated
	} );
	let now = new Date();
	if(now.getTime() - updated.getTime() >= 60000) data = updateData(wikipediaPage);
});

const server = app.listen(3000, function () {
	const host = server.address().address;
	const port = server.address().port;
	console.log(`Example app listening at http:\/\/${host}:${port}`);
});


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
			startDate = year+'-'+month+'-'+day;
		}else{
			endDate = year+'-'+month+'-'+day;
		}
	});

	return {
		'startDate':startDate,
		'endDate':endDate,
		'remain':Number(datum[remain].replace('%','')),
		'leave':Number(datum[remain].replace('%','')),
		'undecided':Number(datum[remain].replace('%','')),
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