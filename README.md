# Bitcoin sweep facility

Tech: Node + Typescript + Express + MongoDb 


## Folder structure 
```
├── src
│   ├── config
│   ├── controllers
│   ├── dtos
│   ├── interfaces
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   ├── tests
│   ├── utils
│   ├── app.ts
│   └── index.ts
```


## Running App in DEV mode
``` 
#Install dependencies
npm i 

#Create dev.env file at root directory for DB_CONNECTION_STRING
touch dev.env

#Add env variable
DB_CONNECTION_STRING = 'mongodb://localhost:27017'

#Start app in dev mode. Default port: 3000
npm start 
```

## Swagger endpoint

``` http://localhost:3000/api-docs ```