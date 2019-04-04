const path = require('path');
const express = require('express');
const xss = require('xss');

const NotesService = require('./notes-service');

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = note => ({
	id: note.id,
	note_name: xss(note.note_name),
	content: xss(note.content),
	folder_id: note.folder_id,
	author_id: note.author_id,
	date_published: note.date_published
});

notesRouter.route('/').get(jsonParser, (req, res, next) => {
	NotesService.getAllNotes(req.app.get('db'))
		.then(notes => {
			res.json(notes.map(serializeNote));
		})
		.catch(next);
});

module.exports = notesRouter;
