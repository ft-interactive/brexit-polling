'use strict';

if (require.main === module){
    console.log('check the modules load');
    require('./bertha.js');
    require('./failsafe.js');
    require('./layouts/index.js');
}
