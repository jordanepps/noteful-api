CREATE TABLE folders (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    folder_name TEXT NOT NULL
);

ALTER TABLE notes
    ADD COLUMN
        folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL;