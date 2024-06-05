const express = require('express');
const router = express.Router();


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
    const problemId = req.params.id;
    res.render('problem', { problemId });
});

module.exports = router;


