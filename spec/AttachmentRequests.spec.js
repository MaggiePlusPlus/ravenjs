var AttachmentRequests = require('../lib/AttachmentRequests'),
	nock = require('nock');

describe('AttachmentRequests', function() {
	var request;

	beforeEach(function() {
		request = new AttachmentRequests('foo', { host: 'http://localhost:81' });
	});

	describe('.get', function() {

		it('should throw when callback is not defined', function() {
			expect(function() { request.get(); }).toThrow();
			expect(function() { request.get(null); }).toThrow();
			expect(function() { request.get(undefined); }).toThrow();
		});

		it('should get attachment with specified key', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/static/foo')
				.reply(200, { foo: 'bar' });

			request.get(function(error, data) {
				expect(error).not.toBeDefined();
				expect(data).toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should return error if response status code is not 200', function(done) {
			var ravendb = nock('http://localhost:81')
				.get('/static/foo')
				.reply(404);

			request.get(function(error, data) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});

	describe('.save', function() {

		it('should throw when save options is undefined', function() {
			expect(function() { request.save(); }).toThrow();
			expect(function() { request.save(null); }).toThrow();
			expect(function() { request.save(undefined); }).toThrow();
		});

		it('should throw when callback is undefined', function() {
			expect(function() { 
				request.save({ buffer: { }});
			}).toThrow();
			expect(function() { 
				request.save({ buffer: { }}, null);
			}).toThrow();
			expect(function() { 
				request.save({ buffer: { }}, undefined);
			}).toThrow();
		});

		it('should throw when save options does not have a buffer property', function() {
			expect(function() { 
				request.save({ }, function() { });
			}).toThrow();
		});

		it('should save attachment', function(done) {
			var ravendb = nock('http://localhost:81')
				.put('/static/foo')
				.reply(201);

			request.save({ buffer: { foo: 'bar' }}, function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should return error when response code is not 201', function(done) {
			var ravendb = nock('http://localhost:81')
				.put('/static/foo')
				.reply(500);

			request.save({ buffer: { foo: 'bar' }}, function(error) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});

	describe('.remove', function() {

		it('should throw error when callback is undefined', function() {
			expect(function() { request.remove(); }).toThrow();
			expect(function() { request.remove(null); }).toThrow();
			expect(function() { request.remove(undefined); }).toThrow();
		});

		it('should send delete request', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/static/foo')
				.reply(204);

			request.remove(function(error) {
				expect(error).not.toBeDefined();
				ravendb.done();
				done();
			});
		});

		it('should return error when response code is not 204', function(done) {
			var ravendb = nock('http://localhost:81')
				.delete('/static/foo')
				.reply(500);

			request.remove(function(error) {
				expect(error).toBeDefined();
				ravendb.done();
				done();
			});
		});
	});
});