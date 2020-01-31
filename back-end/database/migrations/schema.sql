-- psql
-- create user development with password 'development';
-- create database smart_retailer owner development;
-- edit /etc/postgresql/11/main/pg_hba.conf, add the following line
-- local   development     development       md5  #  add this line above the following line
-- local   all          all                              peer
-- npm run db-init

DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS faces CASCADE;
DROP TABLE IF EXISTS recurs CASCADE;
DROP TABLE IF EXISTS traffic CASCADE;
DROP TABLE IF EXISTS persons CASCADE;

CREATE TABLE videos (
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(255) NOT NULL,
  duration INTEGER NOT NULL,
  filmed_at TIMESTAMP NOT NULL, 
  ana_status INTEGER NOT NULL,
  s3_url VARCHAR(255)
);

CREATE TABLE faces (
  id SERIAL PRIMARY KEY NOT NULL,
  sex VARCHAR(32) NOT NULL,
  age INTEGER NOT NULL,
  smile BOOLEAN NOT NULL,
  emotion VARCHAR(32) NOT NULL,
  external_id VARCHAR(255),
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE
);

CREATE TABLE recurs (
  id SERIAL PRIMARY KEY NOT NULL,
  is_recuring BOOLEAN NOT NULL,
  visit_date INTEGER NOT NULL,   /* average days interval of 2 visits: 0 when is_recuring is false */
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE
);

CREATE TABLE persons (
  id SERIAL PRIMARY KEY NOT NULL,
  stay_duration INTEGER NOT NULL,  /* seconds */
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE
);

CREATE TABLE traffic (
  id SERIAL PRIMARY KEY NOT NULL,
  timestamp INTEGER NOT NULL,
  count INTEGER NOT NULL,
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE
);