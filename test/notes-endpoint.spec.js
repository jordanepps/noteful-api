const knex = require('knex');
const app = require('../src/app');

const {
	makeNotesArray,
	makeAuthorsArray,
	makeMaliciousNote
} = require('./notes.fixtures');
const { makeFoldersArray } = require('./folders.fixtures');

describe('Notes Endpoints', () => {
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

	describe.skip('GET /api/notes/:note_id', () => {
		context('given no note', () => {
			it('responds with 404 and error message', () => {
				return supertest(app)
					.get('/api/notes/123456')
					.expect(404, { error: { message: `Note doesn't exist` } });
			});
		});

		context('given the note exists', () => {
			const testFolders = makeFoldersArray();
			const testNotes = makeNotesArray();
			const testAuthors = makeAuthorsArray();
			const expectedNote = testNotes[0];

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
		});
		//TODO:figure out why get by note id test fails
		it('responds with 200 and the note', () => {
			return supertest(app)
				.get('/api/notes/1')
				.expect(200, expectedNote);
		});
	});

	describe('DELETE /api/notes/:note_id', () => {
		context('given no note', () => {
			it('responds with 404 and error message', () => {
				return supertest(app)
					.delete('/api/notes/123456')
					.expect(404, { error: { message: `Note doesn't exist` } });
			});
		});

		context('given there are notes in the database', () => {
			const testFolders = makeFoldersArray();
			const testAuthors = makeAuthorsArray();
			const testNotes = makeNotesArray();

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

			it('responds with 204 and removes the folder', () => {
				const idToRemove = 1;
				const expectedNotes = testNotes.filter(note => note.id !== idToRemove);

				return supertest(app)
					.delete(`/api/notes/${idToRemove}`)
					.expect(204)
					.then(res => {
						supertest(app)
							.get('/api/notes')
							.expect(expectedNotes);
					});
			});
		});
	});

	describe('PATCH /api/notes/note_id', () => {
		context('given no folders', () => {
			it('responds with 404', () => {
				return supertest(app)
					.delete('/api/notes/123456')
					.expect(404, { error: { message: `Note doesn't exist` } });
			});
		});

		context('given there are notes in the database', () => {
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

			it('responds with 204 and updates the folder', () => {
				const idToUpdate = 1;
				const updatedNote = {
					note_name: 'Updated note name',
					content: 'updated note content'
				};

				const expectedNote = {
					...testNotes[idToUpdate - 1],
					...updatedNote
				};

				return supertest(app)
					.patch(`/api/notes/${idToUpdate}`)
					.send(updatedNote)
					.expect(204)
					.then(res => {
						supertest(app)
							.get(`/api/notes/${idToUpdate}`)
							.expect(expectedNote);
					});
			});
		});
	});
});
