//
// Node-OAuth-Shim
// A RESTful API for interacting with OAuth2 services.
//
// @author Andrew Dodson
// @since July 2013

var url = require('url');

var merge = require('./utils/merge');
var param = require('./utils/param');

var oauth2 = require('./oauth2');

// Add the modules
var services = {};

//
// Export a new instance of the API
module.exports = function( req, res, next ){
	return module.exports.request( req, res, next );
};

// Set pretermined client-id's and client-secret
module.exports.init = function(obj){
	services = obj;
};

//
// Request
// Compose all the default operations of this component
//
module.exports.request = function (req, res, next) {
    var self = module.exports;
    return self.interpret(req, res,
        self.redirect.bind(self, req, res,
            self.unhandled.bind(self, req, res, next)));
};

//
// Interpret the oauth login
// Append data to the request object to hand over to the 'redirect' handler
//
module.exports.interpret = function( req, res, next ){
	// if the querystring includes
	// An authentication "code",
	// client_id e.g. "1231232123",
	// response_uri, "1231232123",
	var p = param(url.parse(req.url).search);
	var state = p.state;


	// Has the parameters been stored in the state attribute?
	try{
		// decompose the p.state, redefine p
		p = merge( p, JSON.parse(p.state) );
		p.state = state; // set this back to the string
	}
	catch(e){}

	// Define the options
	req.oauthshim = {
		options : p
	};

	// Generic formatting `redirect_uri` is of the correct format
	if ( typeof p.redirect_uri === 'string' && !p.redirect_uri.match(/^[a-z]+:\/\//i) ) {
		p.redirect_uri = '';
	}


	//
	// OAUTH2
	//
	if( ( p.code || p.refresh_token ) && p.redirect_uri ){

		login( p, oauth2, function( session ){

			// Redirect page
			// With the Auth response, we need to return it to the parent
			if(p.state){
				session.state = p.state || '';
			}

			// OAuth Login
			redirect( req, p.redirect_uri, session, next );
		});
	}
	// Move on
	else if(next){
		next();
	}
};

//
// Redirect Request
// Is this request marked for redirect?
//
module.exports.redirect = function( req, res, next ){
	if( req.oauthshim && req.oauthshim.redirect ){

		var hash = req.oauthshim.data;
		var path = req.oauthshim.redirect;

		path += ( hash ? '#'+ param( hash ) : '' );

		res.writeHead( 302, {
			'Access-Control-Allow-Origin':'*',
			'Location': path
		});

		res.end();
	}
	else if(next){
		next();
	}
};

//
// unhandled
// What to return if the request was previously unhandled
// 
module.exports.unhandled = function( req, res, next ){
	var p = param(url.parse(req.url).search);
	serveUp( res, {
		error : {
			code : 'invalid_request',
			message : 'The request is unrecognised'
		}
	}, p.callback );
};

//
// getCredentials
// Given a network name and a client_id, returns the client_secret
//
module.exports.getCredentials = function(id, callback){
	callback( id ? services[id] : false );
};

//
// Login
// OAuth2
//
function login(p, handler, callback){
	module.exports.getCredentials( p.client_id || p.id, function(client_secret){
		p.client_secret = client_secret;
		handler( p, callback );
	});
}


//
// Process, pass the request the to be processed,
// The returning function contains the data to be sent
function redirect(req, path, hash, next){
	req.oauthshim = req.oauthshim || {};
	req.oauthshim.data = hash;
	req.oauthshim.redirect = path;

	if( next ){
		next();
	}
}

function serveUp(res, body, jsonp_callback){

	if(typeof(body)==='object'){
		body = JSON.stringify(body, null, 2);
	}
	else if(typeof(body)==='string'&&jsonp_callback){
		body = "'"+body+"'";
	}

	if(jsonp_callback){
		body = jsonp_callback + "(" + body + ")";
	}

	res.writeHead(200, { 'Access-Control-Allow-Origin':'*' });
	res.end( body ,"utf8");
}