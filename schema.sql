
DROP TABLE if EXISTS votinghistory;
DROP TABLE if EXISTS upcomingvote;
DROP TABLE if EXISTS politicianfunding;
DROP TABLE if EXISTS candidatedata;
DROP TABLE if EXISTS issuemap;
DROP TABLE if EXISTS politicianinfo;

DROP TABLE if EXISTS votingdistricts;

CREATE TABLE votingdistricts(
    id SERIAL PRIMARY KEY,
    address TEXT,
    state TEXT,
    voting_district TEXT
);

CREATE TABLE politicianinfo(
   voting_district_id INT NOT NULL REFERENCES votingdistricts(id),
   id SERIAL,
   state TEXT,
   voting_district TEXT,
   politician TEXT,
   role TEXT,
   image_url TEXT,
   affiliation TEXT,
   contact_phone TEXT,
   contact_address TEXT,
   website TEXT,
   propublica_id TEXT
   -- reelection_date DATE,
);

-- CREATE TABLE issuemap(
--     issue_type INT,
--     issue_type_name TEXT,
--     UNIQUE (issue_type)
-- );

-- CREATE TABLE votinghistory(
--     id SERIAL PRIMARY KEY,
--     politician TEXT NOT NULL REFERENCES politicianinfo(politician),
--     issue_name TEXT,
--     issue_description TEXT,
--     issue_type INT NOT NULL REFERENCES issuemap(issue_type),
--     position TEXT
-- );

-- CREATE TABLE upcomingvote(
--     issue_name TEXT,
--     issue_description TEXT,
--     issue_type INT NOT NULL REFERENCES issuemap(issue_type),
--     vote_date DATE
-- );

-- CREATE TABLE politicianfunding(
--     politician TEXT NOT NULL REFERENCES politicianinfo(politician),
--     funding_source TEXT,
--     funding_amount TEXT,
--     funding_description TEXT
-- );

-- CREATE TABLE candidatedata(
--     id SERIAL PRIMARY KEY,
--     politician TEXT NOT NULL REFERENCES politicianinfo(politician),
--     election_date DATE,
--     voting_district TEXT,
--     incumbent TEXT
-- );