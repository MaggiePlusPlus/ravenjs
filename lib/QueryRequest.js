var RavenRequest = require('./RavenRequest'),
	querystring = require('querystring'),
	inherits = require('util').inherits,
	format = require('util').format,
	_ = require('underscore');

var QueryRequest = module.exports = function(indexName, settings) {
	if (arguments.length < 2) {
		settings = indexName;
		indexName = undefined;
	}

	RavenRequest.call(this, settings);
	this.indexName = indexName;
	this.queryData = { };
};

inherits(QueryRequest, RavenRequest);

function parseQuery() {
	var self = this;
	if (!self.queryData.where) return undefined;
	return querystring.stringify(self.queryData.where, ' AND ', ':');
}

QueryRequest.prototype.collection = function(collectionName) {
	var self = this;
	if (_(self.indexName).isString()) throw new Error('Cannot specify both an index and collection to query.');
	self.queryData.collection = collectionName;
	return this;
};

QueryRequest.prototype.where = function(field, value) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to query by.');
	if (!_(value).isString()) throw new Error('Expected a valid value string.');

	if (!self.queryData.where) self.queryData.where = { };
	self.queryData.where[field] = value;
	return self;
};

QueryRequest.prototype.and = function(field, value) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to query by.');
	if (!_(value).isString()) throw new Error('Expected a valid value string.');

	if (!self.queryData.where) throw new Error('Invalid usage. Call where() before calling and(). '+
		' and() operator cannot be used before where operator. ');
	self.queryData.where[field] = value;
	return this;
};

QueryRequest.prototype.select = function() {
	var self = this;
	if (arguments.length === 0) throw new Error ('Expected at least one string argument to select.');

	var selectFields = [];
	_(arguments).each(function(arg) {
		if (!_(arg).isString() && !_(arg).isNumber()) throw new Error(format('Invalid arguments. Cannot add %j as a select filter', arg));
		if (!_(arg).isString()) return selectFields.push(toString.call(arg));
		return selectFields.push(arg);
	});
	self.queryData.select = selectFields;
	return self;
};

QueryRequest.prototype.orderBy = function(field) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to sort by');
	self.queryData.orderBy = field;
	return self;
};

QueryRequest.prototype.orderByDescending = function(field) {
	var self = this;
	if (!_(field).isString()) throw new Error('Expected a valid field string to sorty by');
	self.queryData.orderBy = '-' + field;
	return self;
};

QueryRequest.prototype.skip = function(count) {
	var self = this;
	if (!_(count).isNumber()) throw new Error('Expected a valid number for total records to skip.');
	self.queryData.skip = count;
	return self;
};

QueryRequest.prototype.take = function(count) {
	var self = this;
	if (!_(count).isNumber()) throw new Error('Expected a valid number for total records to take.');
	self.queryData.take = count;
	return self;
};

QueryRequest.prototype.results = function(callback) {
	var self = this;
	if (!_(callback).isFunction()) throw new Error('Expected a valid callback function.');
	var queryStrObj = {
		query: parseQuery.call(self),
		fetch: self.queryData.select,
		sort: self.queryData.orderBy,
		start: self.queryData.skip,
		pageSize: self.queryData.take
	};

	if (!queryStrObj.query) delete queryStrObj.query;
	if (!queryStrObj.fetch) delete queryStrObj.fetch;
	if (!queryStrObj.sort) delete queryStrObj.sort;
	if (!queryStrObj.start) delete queryStrObj.start;
	if (!queryStrObj.pageSize) delete queryStrObj.pageSize;
	var query = querystring.stringify(queryStrObj);
	var path = 'indexes/';
	if (self.indexName) {
		path += self.indexName;
	} else {
		path += 'dynamic';
		if (!self.queryData.collection && !query) throw new Error('Invalid query operation. ' +
			'When performing a dynamic query either the collection name or query filters using ' +
			'where() and and() operators must be used.');

		if (self.queryData.collection) path += '/' + self.queryData.collection;
	}
	if (query) path += '?' + query;

	self.sendGet(path, function(error, response, data) {
		if (error) return callback(error);
		if (response.statusCode !== 200) {
			var err = new Error('Failed to get results. Server returned an unexpected response ' + response.statusCode);
			return callback(err, data);
		}
		return callback(undefined, data);
	});
};