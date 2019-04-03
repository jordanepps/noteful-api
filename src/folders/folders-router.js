const path = require('path');
const express = require('express');
const xss = require('xss');

const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const jsonParser = express.json();

foldersRouter.route('/').get((req, res, next) => {
	FoldersService.getAllFolders(req.app.get('db'))
		.then(folders => {
			res.json(folders);
		})
		.catch(next);
});

module.exports = foldersRouter;
