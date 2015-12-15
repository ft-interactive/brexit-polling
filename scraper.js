'use strict';

const request = require('request'),
	  cheerio = require('cheerio');

const wikiPage = 'https://en.wikipedia.org/wiki/Opinion_polling_for_the_United_Kingdom_European_Union_membership_referendum';

const tableOrder = [
	'national-2015',
	'national-2014',
	'national-2013',
	'national-2012',
	'national-2011',
	'national-2010',
	'regional'
];

function getData(tables){
	if(!tables) tables = tableOrder;

	request(wikiPage, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    cheerio.load(body)('table').each(function(i, table){
	    	var tableArray = parseTable(table);
	    	
	    	var csv = tableArray.reduce(function(previous, current){
	    		return previous + '\n' + current.join(',');
	    	},'');
	    	
	    	if(tables[i]){
	    		console.log('----\n\n',tableOrder[i]);
	    		console.log(csv);
	    	}
	    });
	  }
	});
}

function parseTable(table){
	const out = [];
	
	cheerio.load(table)('tr')
		.each( function(j, row){
			const rowArray = [];
			
			cheerio(row).find('th, td').each(function(k, cell){
				rowArray.push( '"'+(cheerio(cell).text().replace(/(\n)+/g,' ').trim())+'"' );
			});

			out.push(rowArray);
		});

	return out;
}


module.exports = getData;