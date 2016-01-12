#Brexit polling data

A web service scraping data from wikipedia's polling page (may change to another source)

An publishing it as machine readable JSON data or as SVG charts

##endpoints

latest poll at a specified size : https://brexit-polling.herokuapp.com/poll/latest/600-x-100.svg
a particular poll at a specified size (eg) : https://brexit-polling.herokuapp.com/poll/ComRes,2015-12-11/600-x-100.svg
json data : https://brexit-polling.herokuapp.com/data.json
summary html table : https://brexit-polling.herokuapp.com/data.html
time series : https://brexit-polling.herokuapp.com/lastmonth/600-x-100.svg (not much to see there)

##running locally
pre-requisites 
 * node
 * git
 
clone the repo

```npm install```
```node index.js```