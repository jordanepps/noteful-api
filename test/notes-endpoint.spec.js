const knex = require('knex');
const app = require('../src/app');

const {
	makeNotesArray,
	makeAuthorsArray,
	makeMaliciousNote
} = require('./notes.fixtures');
const { makeFoldersArray } = require('./folders.fixtures');

describe.only('Notes Endpoints', () => {
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
		db.raw('TRUNCATE notes, folders, authors RESTART IDENTITY CASCADE')
	);

	afterEach('cleanup', () =>
		db.raw('TRUNCATE notes, folders, authors RESTART IDENTITY CASCADE')
	);

	describe('GET /api/notes', () => {
		context('given no notes', () => {
			it('responds with 200 and an empty list', () => {
				return supertest(app)
					.get('/api/notes')
					.expect(200, []);
			});
		});

		context('given there are notes', () => {
			const testFolders = makeFoldersArray();
			const testNotes = makeNotesArray();
			const testAuthors = makeAuthorsArray();

			beforeEach('insert notes', () => {
				return db
					.into('folders')
					.insert(testFolders)
					.then(() => {
						return db.into('authors').insert(testAuthors);
					})
					.then(() => {
						return db.into('notes').insert(testNotes);
					});
			});

			it('responds with 200 and all the notes', () => {
				return supertest(app)
					.get('/api/notes')
					.expect(200, testNotes);
			});
		});

		context('given an XSS attack note', () => {
			const testFolders = makeFoldersArray();
			const testNotes = makeNotesArray();
			const testAuthors = makeAuthorsArray();
			const { maliciousNote, expectedNote } = makeMaliciousNote();

			beforeEach('insert notes', () => {
				return db
					.into('folders')
					.insert(testFolders)
					.then(() => {
						return db.into('authors').insert(testAuthors);
					})
					.then(() => {
						return db.into('notes').insert(testNotes);
					})
					.then(() => {
						return db.into('notes').insert(maliciousNote);
					});
			});

			it('removes xss attack content', () => {
				return supertest(app)
					.get('/api/notes')
					.expect(200)
					.expect(res => {
						expect(res.body[5].note_name).to.eql(expectedNote.note_name);
						expect(res.body[5].content).to.eql(expectedNote.content);
					});
			});
		});
	});

	describe('POST /api/notes', () => {
		const testFolders = makeFoldersArray();
		const testAuthors = makeAuthorsArray();

		beforeEach('insert notes', () => {
			return db
				.into('folders')
				.insert(testFolders)
				.then(() => {
					return db.into('authors').insert(testAuthors);
				});
		});

		it('creates a note, responding with 201 and the new note', () => {
			const newNote = {
				note_name: 'Test note name',
				content: 'Test note content',
				folder_id: 1,
				author_id: 1
			};
			return supertest(app)
				.post('/api/notes')
				.send(newNote)
				.expect(201)
				.expect(res => {
					expect(res.body.note_name).to.eql(newNote.note_name);
					expect(res.body.content).to.eql(newNote.content);
				});
		});

		const requiredFields = ['note_name', 'content', 'folder_id', 'author_id'];

		requiredFields.forEach(field => {
			const newNote = {
				note_name: 'Test note name',
				content: 'test note content',
				folder_id: 1,
				author_id: 1
			};

			it(`responds with 400 and an error message when the '${field}' is missing`, () => {
				delete newNote[field];

				return supertest(app)
					.post('/api/notes')
					.send(newNote)
					.expect(400, {
						error: { message: `Missing '${field}' in request body` }
					});
			});
		});

		it('removes xss attack content from response', () => {
			const { maliciousNote, expectedNote } = makeMaliciousNote();

			return supertest(app)
				.post('/api/notes')
				.send(maliciousNote)
				.expect(201)
				.expect(res => {
					expect(res.body.note_name).to.eql(expectedNote.note_name);
					expect(res.body.content).to.eql(expectedNote.content);
				});
		});
	});
});
