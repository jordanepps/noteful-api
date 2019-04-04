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

notesRouter
	.route('/')
	.get((req, res, next) => {
		NotesService.getAllNotes(req.app.get('db'))
			.then(notes => {
				res.json(notes.map(serializeNote));
			})
			.catch(next);
	})
	.post(jsonParser, (req, res, next) => {
		const { note_name, content, folder_id, author_id } = req.body;
		const newNote = { note_name, content, folder_id, author_id };

		for (const [key, value] of Object.entries(newNote)) {
			if (value == null) {
				return res
					.status(400)
					.json({ error: { message: `Missing '${key}' in request body` } });
			}
		}

		NotesService.insertNote(req.app.get('db'), newNote)
			.then(note => {
				res
					.status(201)
					.location(path.posix.join(req.originalUrl, `/${note.id}`))
					.json(serializeNote(note));
			})
			.catch(next);
	});

notesRouter
	.route('/:note_id')
	.all((req, res, next) => {
		NotesService.getById(req.app.get('db'), req.params.note_id).then(note => {
			if (!note) {
				return res
					.status(404)
					.json({ error: { message: `Note doesn't exist` } });
			}

			res.note = note;
			next();
		});
	})
	.get((req, res, next) => {
		res.json(serializeNote(res.note));
	});

module.exports = notesRouter;
