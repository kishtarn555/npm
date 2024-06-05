const express = require('express');
const router = express.Router();
const sendData = require('../controllers/submit')
const getData = require('../controllers/problem')
const path = require('path')

router.get('/',(req, res, next)=> {
    res.render('home')
})

router.get('/submit',(req, res, next)=> {
    res.render('submit')
})

router.get('/problems',(req, res, next)=> {
    res.render('problems')
})

router.get('/problem/:id', (req, res) => {
    getData(req.params.id).then(
        (data)=> {
            console.log(data)
        res.render('problem', data)
        }
    )
});


router.get('/blog', (req, res) => {
    const problemId = req.params.id;
    res.render('blog', { problemId });
});

router.post('/submit', (req, res) => {
    
    console.log(req.body);
    
    sendData(req.body).then(
        (sol)=> {
            res.send(sol)
        }
    );
});

router.get('/log', (req, res) => {
    
    res.sendFile(path.join(__dirname, '../access.log'))
});

module.exports = router;


