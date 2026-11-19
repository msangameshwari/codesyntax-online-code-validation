# Network Request Flow and Monitor Data

The browser Axios client records request start time, method, endpoint, response status, duration, timestamp, and response `X-Request-Id` when present. The Express middleware records request ID, method, path, response status, and measured server duration to MongoDB; it never stores headers or bodies. NetworkLog retention is configured to expire records after 30 days. `/api/network/logs` returns the latest 100 records to authenticated users.

The Network Monitor charts use those records only. Empty datasets display “No network activity recorded.” 4xx/5xx counts and alerts are derived from logged status; slow responses use the documented 2,000 ms threshold. Health includes actual Mongo readiness. It does not capture packets, IP paths, or DNS lookups. Alert acknowledgement and persistent audit history are not implemented; operational request logs are not deleted by the page.
