## Background

Unzips and munges AWS API Gateway logs held in Cloudwatch and uploaded into s3 into file formats for whatever.

* Currently produces CSV file for use in JMeter.

## Usage

`node index.js <dir>`

Where <dir> is a directory holding an s3 download of logs exported from an API Gateway.

The dir will look something like 

```
♪  ~  cd code/bf/logs 
♪  logs  l
total 8
-rw-r--r--    1 faizn  staff    27B 29 Jul 16:47 aws-logs-write-test
drwxr-xr-x  515 faizn  staff    16K 30 Jul 09:26 1134d664-0b00-4ec6-84a1-f0c53466bf63
♪  logs  cd 1134d664-0b00-4ec6-84a1-f0c53466bf63 
♪  1134d664-0b00-4ec6-84a1-f0c53466bf63  l
total 0
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 01e949ecdfef9c4e7c3e3a932d7110aa
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 058288f3b5ad4af4c935e103ba0a7462
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 04a19249ba8fe52b37cc2c545385a05f
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 0387be7c8ce761a5c40101669233b372
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 023e0ea85c192e9da5654dc5ca247398
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 05622a22769c7bbf2ce6c9e65bcec6a4
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 060fc7cf69c1d161d4d6ce5b191c6318
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 02390b229a42d10d853a6f60abf38a79
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 0559eba5e8038d0f315516a9ee901975
drwxr-xr-x  3 faizn  staff    96B 30 Jul 09:26 003a0302870dcbbdce4bea05b1b2744b

etc..
```






