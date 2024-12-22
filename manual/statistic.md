&#9665; [API](api.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Error Handling](error-handling.md) &#9655;
- - -

# Statistic

The statistics are created hourly and final once a day. It is useful when the
service is used as a high-frequency one with a disabled access log if you want
to minimize the consumption of storage space. The statistics are written to the
output log and are structured as follows:

```
2021-02-21 09:00:00 Statistic Requests 424, Inbound 0.73 MB, Outbound 0.17 MB, Execution 0.58 sec, Errors 0
```

| Field     | Description                                                               |
| :-------- |:--------------------------------------------------------------------------|
| Requests  | Number of incoming requests                                               |
| Inbound   | Data volume of incoming requests (without headers) in MB                  | 
| Outbound  | Data volume of outgoing response (without headers) in MB                  |
| Execution | Execution for receiving, processing and responding of requests in seconds |
| Errors    | Number of responses with status class 5xx                                 |



- - -
&#9665; [API](api.md)
&nbsp;&nbsp;&nbsp;&nbsp; &#8801; [Table of Contents](README.md)
&nbsp;&nbsp;&nbsp;&nbsp; [Error Handling](error-handling.md) &#9655;