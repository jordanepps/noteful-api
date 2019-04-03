const NotesService = {
	insertNote(knex, newNote) {
		return knex('notes')
			.insert(newNote)
			.returning('*')
			.then(rows => rows[0]);
	},

	getAllNotes(knex) {
		return knex('notes').select('*');
	},

	getById(knex, id) {
		return knex('notes')
			.select('*')
			.where({ id })
			.first();
	},

	getByFolderId(knex, folder_id) {
		return knex('notes')
			.select('*')
			.where({ folder_id });
	},

	updateNote(knex, id, newNoteFields) {
		return knex('notes')
			.where({ id })
			.update(newNoteFields);
	},

	deleteNote(knex, id) {
		return knex('notes')
			.where({ id })
			.delete();
	}
};
module.exports = NotesService;
