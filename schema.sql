DROP TABLE if EXISTS votingDistricts;
DROP TABLE if EXISTS nationalRepresentative;
DROP TABLE if EXISTS stateRepresentative;
DROP TABLE if EXISTS nationalSenatorOne;
DROP TABLE if EXISTS nationalSenatorTwo;
DROP TABLE if EXISTS stateSenatorOne;
DROP TABLE if EXISTS stateSenatorTwo;
DROP TABLE if EXISTS politicianInfo;
DROP TABLE if EXISTS votingHistory;
DROP TABLE if EXISTS upcomingVote;
DROP TABLE if EXISTS issueMap;
DROP TABLE if EXISTS politicianFunding;
DROP TABLE if EXISTS candidateData;

CREATE TABLE votingDistricts{
    id SERIAL PRIMARY KEY,
    address TEXT,
    zipcode TEXT,
    voting_district TEXT
}

CREATE TABLE nationalRepresentative{
    voting_district TEXT,
    politician TEXT
}

CREATE TABLE stateRepresentative{
    voting_district TEXT,
    politician TEXT
}

CREATE TABLE nationalSenatorOne{
    voting_district TEXT,
    politician TEXT
}

CREATE TABLE nationalSenatorTwo{
    voting_district TEXT,
    politician TEXT
}

CREATE TABLE stateSenatorOne{
    voting_district TEXT,
    politician TEXT
}

CREATE TABLE stateSenatorTwo{
    voting_district TEXT,
    politician TEXT
}

CREATE TABLE politicianInfo{
    politician TEXT,
    affiliation TEXT,
    contact_phone TEXT,
    contact_address TEXT,
    service_length TEXT,
    reelection_date DATE
}

CREATE TABLE votingHistory{
    id SERIAL PRIMARY KEY,
    politician TEXT,
    issue_name TEXT,
    issue_description TEXT,
    issue_type INT,
    position TEXT
}

CREATE TABLE upcomingVote{
    issue_name TEXT,
    issue_description TEXT,
    issue_type INT,
    vote_date DATE
}

CREATE TABLE issueMap{
    issue_type INT,
    issue_type_name TEXT
}

CREATE TABLE politicianFunding{
    politician TEXT,
    funding_source TEXT,
    funding_amount TEXT,
    funding_description TEXT
}

CREATE TABLE candidateData{
    id SERIAL PRIMARY KEY,
    politician TEXT,
    election_date DATE,
    voting_district TEXT,
    incumbent TEXT
}