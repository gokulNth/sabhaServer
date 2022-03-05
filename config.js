const md5 = require('md5');
const mysql = require('mysql');

const key = "Science is a way of life. Science is a perspective. Science is the process that takes us from confusion to understanding in a manner that's precise, predictive and reliable - a transformation, for those lucky enough to experience it, that is empowering and emotional.";

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'dummyData',
    // database: 'sabhaApp',
});

module.exports = {
    db,
    canAllowed: (req, res, next) => {
        if (req.url.includes('/login') || req.url.includes('/api/member')) {
            next();
        } else if (req.headers.details) {
            const id = req.headers.details;
            let getUser = `select profile from user_list where username = ?;`;
            db.query(getUser, [id], (err, rows) => {
                if (rows) {
                    if (canNavigate(rows[0].profile, req.url, id) && md5(`${rows[0].profile}_${id}_${key}`) === req.headers.authorization) {
                        next();
                    } else {
                        res.status(401).send("Unauthorized")
                    }
                } else {
                    res.status(401).send("Unauthorized")
                }
            });
        } else {
            res.status(401).send("Unauthorized")
        }
    },
    myLogger: (req, res, next) => {
        console.log(req.url, req.body, req.params, req.query);
        next();
    }
}

function canNavigate(profile, url, id) {
    if (url.includes(`/member?`) || url.includes(`/child`)) return true;
    else if (profile === 1) {
        if (url.includes(`/${id}`)) return true;
    } else if (profile === 2) {
        if (url.includes(`/update/vote`) || url.includes('/searchall') || url.includes('/online') || url.includes('/offline')) {
            return false;
        } else {
            return true;
        }
    } else if (profile === 3) {
        if (url.includes(`/update/vote`) || url.includes(`/${id}`) || url.includes('/searchall') || url.includes('/online') || url.includes('/offline')) {
            return true;
        }
    } else if (profile === 4) {
        return true;
    }
    return false;
}