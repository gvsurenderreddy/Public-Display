// Fetch base url
// And store into base_url
var pathArray = window.location.href.split( '/' );
var protocol = pathArray[0];
var host = pathArray[2];
var base_url = protocol + '//' + host + '/';
console.log('[DEBUG] base_url: ' + base_url);