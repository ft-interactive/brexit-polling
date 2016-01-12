#Brexit polling data

[![Build Status][travis-image]][travis-url]

A web service scraping data from wikipedia's polling page (NOTE: may change to another source)

An publishing it as machine readable JSON data or as SVG charts

##endpoints

 * latest poll at a specified size : https://ft-ig-brexit-polling.herokuapp.com/poll/latest/600-x-100.svg
 * a particular poll at a specified size (eg) : https://ft-ig-brexit-polling.herokuapp.com/poll/ComRes,2015-12-11/600-x-100.svg
json data : https://ft-ig-brexit-polling.herokuapp.com/data.json
summary html table : https://ft-ig-brexit-polling.herokuapp.com/data.html
time series : https://ft-ig-brexit-polling.herokuapp.com/lastmonth/600-x-100.svg (not much to see there)

##running locally
pre-requisites 
 * node
 * git
 
clone the repo and then ...

```npm install```
```node index.js```

<!-- badge URLs -->
[travis-url]: http://travis-ci.org/ft-interactive/starter-kit
[travis-image]: https://img.shields.io/travis/ft-interactive/starter-kit.svg?style=flat-square