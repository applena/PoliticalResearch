DROP TABLE if EXISTS votingdistricts;

CREATE TABLE votingdistricts(
    id SERIAL PRIMARY KEY,
    address TEXT,
    voting_district TEXT
);