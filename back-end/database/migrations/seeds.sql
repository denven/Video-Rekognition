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

INSERT INTO videos (name, duration, filmed_at, ana_status, s3_url) VALUES   
  ('VID_20200106_185815.mp4', 23, '2020-01-06 16:30:20', 4, 'https://retailer-videos.s3-us-west-2amazonaws.com/VID_20200106_185815.mp4' ),
  ('VID_20200107_185815.mp4', 55, '2020-01-07 16:30:20', 4, 'https://retailer-videos.s3-us-west-2amazonaws.com/VID_20200106_185815.mp4' ),
  ('VID_20200108_185815.mp4', 120, '2020-01-08 16:30:20', 4, 'https://retailer-videos.s3-us-west-2amazonaws.com/VID_20200106_185815.mp4' ),
  ('VID_20200109_185815.mp4', 3500, '2020-01-09 16:30:20', 4, 'https://retailer-videos.s3-us-west-2amazonaws.com/VID_20200106_185815.mp4' ),
  ('VID_20200110_185815.mp4', 200, '2020-01-10 16:30:20', 4, 'https://retailer-videos.s3-us-west-2amazonaws.com/VID_20200106_185815.mp4' ),
  ('VID_20200111_185815.mp4', 128, '2020-01-11 16:30:20', 4, 'https://retailer-videos.s3-us-west-2amazonaws.com/VID_20200106_185815.mp4' );

INSERT INTO faces (sex, age, smile, emotion, external_id, video_id) VALUES  
  ('Male',  2, true, 'SAD', 'xxxx', 1),
  ('Female', 2, false, 'HAPPY', 'xxx', 1),
  ('Male', 2, true, 'HAPPY', 'xxxx', 1),
  ('Female', 3, true, 'CONFUSED', 'xxxx', 2),
  ('Male', 3, false, 'DISGUSED', 'xxxx', 2),
  ('Male', 4, true, 'SURPRISED', 'xxxx', 2),
  ('Female', 2, true, 'CALM', 'xxxx', 3),
  ('Male', 3, false, 'CALM', 'xxxx', 3),
  ('Male', 2, true, 'HAPPY', 'xxxx', 3),
  ('Female', 4, true, 'CALM', 'xxxx', 4),
  ('Female', 3, true, 'FEAR', 'xxxx', 4),
  ('Male', 4, true, 'HAPPY', 'xxxx', 4),
  ('Male', 3, false, 'CONFUSED', 'xxxx', 5),
  ('Male', 2, true, 'FEAR', 'xxxx', 5),
  ('Female', 2, true, 'CALM', 'xxxx', 5),
  ('Female', 3, false, 'FEAR', 'xxxx', 5),
  ('Male', 4, true, 'HAPPY', 'xxxx', 6),
  ('Male', 3, true, 'CONFUSED', 'xxxx', 6),
  ('Male', 2, true, 'FEAR', 'xxxx', 6);


INSERT INTO recurs (is_recuring, visit_date, video_id) VALUES  
  (true, 2, 1),   (false, 0, 1),   (false, 0, 1),   (true, 2, 2),
  (false, 0, 1),  (true, 2, 2),   (false, 0, 2),   (true, 2, 2),
  (true, 2, 3),   (true, 3, 3),   (true, 5, 3),   (true, 8, 3),
  (true, 2, 4),    (true, 2, 4),   (true, 20, 1),   (false, 0, 4),
  (true, 2, 5),   (false, 0, 5),   (true, 12, 5),   (true, 2, 6),
  (true, 2, 6),   (true, 4, 6),   (true, 3, 6),   (true, 2, 6);

INSERT INTO persons (stay_duration, video_id) VALUES  
  (10, 1),   (30, 1), (20, 1),   (30, 2), (40, 2),   (10, 2), 
  (20, 2),   (120, 3), (100, 3),   (10, 3), (10, 3),   (10, 3), 
  (30, 4),   (130, 4), (80, 4),   (120, 4), (200, 4),   (35, 4), 
  (40, 5),   (140, 5), (10, 5),   (145, 6), (30, 6),   (89, 6), 
  (50, 6),   (150, 6), (320, 6),   (150, 6), (188, 6),   (20, 6);

INSERT INTO traffic (timestamp, count, video_id) VALUES   
  (0, 1, 1),   (22, 2, 1),   (35, 1, 1),   (48, 3, 1), 
  (0, 1, 2),   (10, 1, 2),   (40, 3, 2),   (50, 5, 2), 
  (0, 2, 3),   (100, 5, 3),   (150, 3, 4),   (220, 3, 4), 
  (0, 6, 5),   (230, 18, 5),   (480, 13, 5),   (1000, 21, 5),
  (0, 3, 5),   (130, 8, 6),   (350, 13, 6),   (400, 21, 6);