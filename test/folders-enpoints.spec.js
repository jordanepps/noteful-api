const knex = require('knex');
const app = require('../src/app');

const { makeFoldersArray } = require('./folders.fixtures');

describe('Folders Enpoints', () => {
	let db;

	before('make knex instance', () => {
		db = knex({
			client: 'pg',
			connection: process.env.TEST_DB_URL
		});
		app.set('db', db);
	});

	after('disconnect from db', () => db.destroy());

	before('clean the table', () =>
		db.raw('TRUNCATE folders RESTART IDENTITY CASCADE')
	);

	afterEach('cleanup', () =>
		db.raw('TRUNCATE folders RESTART IDENTITY CASCADE')
	);

	describe('GET /api/folders', () => {
		context('given no folders', () => {
			it('responds with 200 and an empty list', () => {
				return supertest(app)
					.get('/api/folders')
					.expect(200, []);
			});
		});

		context('given there are folders', () => {
			const testFolders = makeFoldersArray();

			beforeEach('insert folders', () => {
				return db.into('folders').insert(testFolders);
			});

			it('responds with 200 and all of the folders', () => {
				return supertest(app)
					.get('/api/folders')
					.expect(200, testFolders);
			});
		});
	});
});
