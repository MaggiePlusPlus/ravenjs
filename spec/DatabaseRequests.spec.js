var DatabaseRequests = require('../lib/DatabaseRequests'),
	RavenRequest = require('../lib/RavenRequest'),
	nock = require('nock');

describe('DatabaseRequests', function() {

	describe('.ctor', function() {

		it('should throws when settings is not defined', function(){
			expect(function() { new DatabaseRequest(); }).toThrow();
			expect(function() { new DatabaseRequest(undefined); }).toThrow();
			expect(function() { new DatabaseRequest(null); }).toThrow();
		});

		it('should remove database setting if exists', function() {
			var settings = { host: 'http://localhost:81', database: 'foo' };
			var request = new DatabaseRequests(settings);
			expect(request.settings.database).not.toBeDefined();
		});
	});

	describe('.list', function() {
		var request;

		beforeEach(function() {
			request = new DatabaseRequests( { host: 'http://localhost:81' });
		});

		it('should throw when callback is not defined', function() {
			expect(function() { requests.list(); }).toThrow();
			expect(function() { requests.list(undefined); }).toThrow();
			expect(function() { requests.list(null); }).toThrow();
		});

		it('should return error when databases cannot be enumerated', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/databases')
				.reply(404);

			request.list(function(error, results) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should return list of databases', function(done) {
			var data = [
				{
					'@metadata': {
						'@id': 'Raven/Databases/abc',
						'@etag': '0000-000-001'
					},
					'Last-Modified': '2012-06-16T04:12:35.9130000',
					Settings: { 'Raven/DataDir': '~/Tennants/Test' }
				},
				{
					'@metadata': {
						'@id': 'Raven/Databases/def',
						'@etag': '0000-000-001'
					},
					'Last-Modified': '2012-06-16T04:12:35.9130000',
					Settings: { 'Raven/DataDir': '~/Tennants/Def' }
				}
			];

			var ravendb = nock('http://localhost:81')
				.get('/databases')
				.reply(200, data, { 'content-type': 'application/json; charset=utf-8' });

			request.list(function(error, results) {
				expect(error).not.toBeDefined();
				expect(results).toBeDefined();
				expect(results.length).toBe(2);

				expect(results[0].id).toBe('Raven/Databases/abc');
				expect(results[0].name).toBe('abc');
				expect(results[0].lastModified).toBe('2012-06-16T04:12:35.9130000');
				expect(results[0].dataDirectory).toBe('~/Tennants/Test');
				ravendb.done();
				done();
			});
		});
	});

	describe('.exists', function() {

		var request;

		beforeEach(function() {
			request = new DatabaseRequests({ host: 'http://localhost:81' });
		});

		it('should throw when database name is not defined', function() {
			expect(function() { request.exists(); }).toThrow();
			expect(function() { request.exists(null); }).toThrow();
			expect(function() { request.exists(undefined); }).toThrow();
		});

		it('should throw when callback is not defined', function() {
			expect(function() { request.exists('foo'); }).toThrow();
			expect(function() { request.exists('foo', null); }).toThrow();
			expect(function() { request.exists('foo', undefined); }).toThrow();
		});

		it('should return false when server returns a 404', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/Raven/Databases/foo')
				.reply(404);

			request.exists('foo', function(error, result) {
				expect(error).not.toBeDefined();
				expect(result).toBe(false);
				ravendb.done();
				done();
			});
		});

		it('should return true when server returns a 200', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/Raven/Databases/foo')
				.reply(200);

			request.exists('foo', function(error, result) {
				expect(error).not.toBeDefined();
				expect(result).toBe(true);
				ravendb.done();
				done();
			});
		});
	});

	describe('.create', function() {
		var request;

		beforeEach(function() {
			request = new DatabaseRequests( { host: 'http://localhost:81' });
		});

		it('should throw when database name is not defined', function() {
			expect(function() { request.create(); }).toThrow();
			expect(function() { request.create(null); }).toThrow();
			expect(function() { request.create(undefined); }).toThrow();
		});

		it('should throw when callback is not defined', function() {
			expect(function() { request.create('foo'); }).toThrow();
			expect(function() { request.create('foo', undefined); }).toThrow();
			expect(function() { request.create('foo', null); }).toThrow();
		});

		it('should return error if database already exists', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/Raven/Databases/foo')
				.reply(200);

			request.create('foo', function(error) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should not return error when database is created.', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/Raven/Databases/foo')
				.reply(404)
				.put('/docs/Raven/Databases/foo')
				.reply(201);

			request.create('foo', function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});
	});

	describe('.remove', function() {
		
		var request;

		beforeEach(function() {
			request = new DatabaseRequests({ host: 'http://localhost:81' });
		});

		it('should throw when database name is not defined', function() {
			expect(function() { request.remove(); }).toThrow();
			expect(function() { request.remove(null); }).toThrow();
			expect(function() { request.remove(undefined); }).toThrow();
		});

		it('should throw when callback is not defined', function() {
			expect(function() { request.remove('foo'); }).toThrow();
			expect(function() { request.remove('foo', null); }).toThrow();
			expect(function() { request.remove('foo', undefined); }).toThrow();
		});

		it('should return error if database cannot be deleted.', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/docs/Raven/Databases/foo')
				.reply(500);

			request.remove('foo', function(error) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});

	describe('.ensure', function() {
		var request;

		beforeEach(function() {
			request = new DatabaseRequests({ host: 'http://localhost:81' });
		});

		it('should throw when database name is not defined', function() {
			expect(function() { request.remove(); }).toThrow();
			expect(function() { request.remove(null); }).toThrow();
			expect(function() { request.remove(undefined); }).toThrow();
		});

		it('should throw when callback is not defined', function() {
			expect(function() { request.remove('foo'); }).toThrow();
			expect(function() { request.remove('foo', null); }).toThrow();
			expect(function() { request.remove('foo', undefined); }).toThrow();
		});

		it('should create the database if it doesn not exist', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/Raven/Databases/foo')
				.reply(404)
				.put('/docs/Raven/Databases/foo')
				.reply(201);

			request.ensureExists('foo', function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should not create database when it already exists.', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/docs/Raven/Databases/foo')
				.reply(200);

			request.ensureExists('foo', function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});
	});
});