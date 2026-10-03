-- Private setup template only. Never add actual future itinerary data to Git.
-- User/authorized parent inserts real periods directly into private.travel_schedule.
-- Each period includes one city/time zone/status, using explicit UTC/offset times.
-- End is exclusive; overlapping periods are rejected.
-- No flight: use NULL for both flight fields.
insert into private.travel_schedule
  (starts_at, ends_at, place, zone, clock_label, status, latitude, longitude, flight_number, flight_arrival)
values
  ('<START_ISO_WITH_OFFSET>', '<END_ISO_WITH_OFFSET>', '<CITY>', '<IANA_ZONE>',
   '<CLOCK_LABEL>', '<STATUS>', <LATITUDE>, <LONGITUDE>, NULL, NULL);
