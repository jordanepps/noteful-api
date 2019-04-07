module.exports = {
	PORT: process.env.PORT || 8000,
	NODE_ENV: process.env.NODE_ENV || 'deployment',
	DB_URL:
		process.env.DATABASE_URL || 'postgresql://jordanepps@localhost/noteful'
};
