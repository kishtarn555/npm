const express = require('express');
const path = require('path')
const app = express();
var fs = require('fs')
var morgan = require('morgan')
const bodyParser = require('body-parser');


const routes = require('./routes/index');
const mongo = require('./mondodb')

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })

// app.set('port', process.env.PORT || 3000);
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')))

app.use(morgan('combined',{stream: accessLogStream}));
app.use('/rekarel', express.static(path.join(__dirname, 'ReKarel/webapp')));


app.use((req, res, next)=>{
    console.log(`${req.url}, ${req.method}`);
    next();
});

app.use(routes);


app.listen(80, ()=> console.log("listening"));

mongo.run().catch(console.dir);
