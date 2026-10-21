## 2026-10-21 - Custom Buffer Parsing Bottlenecks
**Learning:** Custom JS `indexOf` loops iterating byte-by-byte on Node `Buffer` instances during multipart HTTP file uploads cause heavy CPU overhead on multi-megabyte payloads.
**Action:** Use native Node `Buffer.indexOf` and `Buffer.subarray` for boundary detection and slice operations to leverage C++ native execution paths.
