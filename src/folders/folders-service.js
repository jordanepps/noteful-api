const FoldersService = {
	insertFolder(knex, newFolder) {
		return knex('folders')
			.insert(newFolder)
			.returning('*')
			.then(rows => rows[0]);
	},

	getAllFolders(knex) {
		return knex('folders').select('*');
	},

	getById(knex, id) {
		return knex('folders')
			.select('*')
			.where({ id })
			.first();
	},

	updateFolder(knex, id, newFolderFields) {
		return knex('folders')
			.where({ id })
			.update(newFolderFields);
	},

	deleteFolder(knex, id) {
		return knex('folders')
			.where({ id })
			.delete();
	}
};
module.exports = FoldersService;
