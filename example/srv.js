var http = require('http'),
	url = require('url'),
	mysql = require("db-mysql"),
	cacheio = require("../cacheio");

// init caching
var cacheOpts = { cacheTTL : 60 }
var entryStore = new cacheio.CacheStore(cacheOpts);

// connecting the mysql
entryStore.mysqlClient = new mysql.Database({
		hostname : 'localhost',
		user : 'cacheio',
		password : 'xioxio',
		database : 'application'
});
entryStore.mysqlClient.connect(function(error){
	if(error){
		// too bad
	}
});

// defining the mysql getter
entryStore.entryGet = function(eid, cb){
	var cache = this;
	this.mysqlClient.query().select('*').from('users').where('id=?', [eid]).execute(function(error, results){
		if(!error){
			if(results.length > 0){
				// have our results
				cache.setCache(eid, results[0]);
				cb.apply(this, [  false, cache.cache[eid].data ]);
			} else {
				// user missing
				cache.setNegativeCache(eid);
				cb.apply(this, [ 'session unfound' ]);
			}
		} else {
			// query error
			cb.apply(this, [ 'db query error : ' + error ]);
		}
	});
}



// define server
http.createServer(function (req, res) {
	var eid = url.parse(req.url, true).query.eid;
	entryStore.get(eid, function(err, data){
		res.writeHead(200, {'Content-Type': 'text/plain'});
		if(err){
			res.end(err);
		} else {
			res.end(JSON.stringify(data));
		}
	});
}).listen(8000, "127.0.0.1");
