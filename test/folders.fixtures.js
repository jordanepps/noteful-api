function makeFoldersArray() {
	return [
		{ id: 1, folder_name: 'Important' },
		{ id: 2, folder_name: 'Super' },
		{ id: 3, folder_name: 'Spangley' }
	];
}

function makeMaliciousFolder() {
	const maliciousFolder = {
		id: 911,
		folder_name: 'Naughty naughty very naughty <script>alert("xss");</script>'
	};
	const expectedFolder = {
		...maliciousFolder,
		folder_name:
			'Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;'
	};
	return {
		maliciousFolder,
		expectedFolder
	};
}

module.exports = { makeFoldersArray, makeMaliciousFolder };
