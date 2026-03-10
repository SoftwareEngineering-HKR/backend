# Using the backend
If the backend is used on Linux it can be started with:  
`docker compose up`

When using docker on Windows the automatic device discovery won't work:  
`docker compose -f docker-compose-windows.yaml up`

To get the automatic device discovery to work on Windows, first the database has to be started with:  
`docker compose up db`  
Then the backend has to be started without docker:
```
npm i
npm start
```

