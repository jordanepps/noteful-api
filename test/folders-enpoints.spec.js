const knex = require('knex');
const app = require('../src/app');

const { makeFoldersArray, makeMaliciousFolder } = require('./folders.fixtures');

describe('Folders Endpoints', () => {
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

		context('given an XSS attack folder', () => {
			const testFolders = makeFoldersArray();
			const { maliciousFolder, expectedFolder } = makeMaliciousFolder();

			beforeEach('insert malicious folder', () => {
				return db
					.into('folders')
					.insert(testFolders)
					.then(() => {
						return db.into('folders').insert(maliciousFolder);
					});
			});

			it('removes xss attack content', () => {
				return supertest(app)
					.get('/api/folders')
					.expect(200)
					.expect(res => {
						expect(res.body[3].folder_name).to.eql(expectedFolder.folder_name);
					});
			});
		});
	});

	describe('POST /api/folders', () => {
		it('creates a folder, responding with 201 and the new folder', () => {
			const newFolder = { folder_name: 'Test folder' };
			return supertest(app)
				.post('/api/folders')
				.send(newFolder)
				.expect(201)
				.expect(res => {
					expect(res.body.folder_name).to.eql(newFolder.folder_name);
				});
		});

		it(`responds with 400 and an error message when the 'folder_name' field is missing`, () => {
			return supertest(app)
				.post('/api/folders')
				.send({ id: 1 })
				.expect(400, {
					error: { message: `Missing 'folder_name' in request body` }
				});
		});

		it('removes xss attack content from response', () => {
			const { maliciousFolder, expectedFolder } = makeMaliciousFolder();
			return supertest(app)
				.post('/api/folders')
				.send(maliciousFolder)
				.expect(201)
				.expect(res => {
					expect(res.body.folder_name).to.eql(expectedFolder.folder_name);
				});
		});
	});
});
