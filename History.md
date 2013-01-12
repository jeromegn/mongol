# 0.2.0 / 2013-01-12

- Removed monk dependency;
- Replaced monk's promises with RSVP's;
- Now using mongoskin;
- Allow for different types of `_id` in a schema.

# 0.1.5 / 2012-10-12

- Don't cast the `_id` to an ObjectID by default.

# 0.1.4 / 2012-10-08

- Fixed `find`.

# 0.1.3 / 2012-10-07

- Added indexing;
- Added docs within the code.

# 0.1.2 / 2012-10-07

- Removed `update` hook. (Had no idea how to handle the update hook (what to pass, what to do with changes));
- Added `reload` to get the latest version of an instance from the database.

# 0.1.1 / 2012-10-06

- Fixed the hooks;
- Added some hooks tests.

# 0.1.0 / 2012-10-05

- Added "partial" instances support (the results of requesting only certain fields when finding or updating);
- Refactored schemas
- Refactored model inheritance

# 0.0.2 / 2012-10-04

- Added instance methods `save`, `update`, `remove`;
- Added documentation;
- More thorough tests.

# 0.0.1 / 2012-10-03

- Initial release.