const express = require('express');
const parser = require('body-parser');
const cors = require('cors');
const { canAllowed, myLogger, db } = require('./config');
const { constructGetMembersQuery, getQueryVariables, constructAddQuery } = require('./queries');

const app = express();
app.use(cors());
app.use([
  canAllowed,
  myLogger
]);
app.use(parser.json());

app.get('/api/member', (req, res) => {
  db.query(constructGetMembersQuery(req), (err, rows) => {
    if (err) {
      res.status(404).send("Invalid Request");
    } else {
      res.status(200).send(rows);
    }
  });
});

app.get('/api/member/:mid', (req, res) => {
  const id = req.params.mid;
  db.query(
    'select name_list.member_name, name_list.father_name, detail_list.* from name_list inner join detail_list on name_list.id=detail_list.id where name_list.id = ?;',
    [id],
    (err, result) => {
      if (err) {
        res.status(404).send('No Member Found');
      } else {
        res.status(200).send(result);
      }
    }
  );
});

app.get('/api/child/:id', (req, res) => {
  const id = req.params.id;
  db.query(
    'select name_list.id, name_list.member_name, detail_list.phone, detail_list.marital_status, detail_list.spouse_name, detail_list.dob, detail_list.email_id, detail_list.custom_field from name_list inner join detail_list on name_list.id=detail_list.id where name_list.id = ?;',
    [id],
    (err, result) => {
      if (err) {
        res.status(404).send('No Member Found');
      } else {
        res.status(200).send(result);
      }
    }
  );
});

app.get('/api/searchall', (req, res) => {
  const { sortQuery, limitQuery, searchQuery } = getQueryVariables(req.query);

  let Query = `select name_list.id, name_list.member_name, name_list.father_name, detail_list.phone, detail_list.address, detail_list.whatsapp, detail_list.photo, detail_list.mother_name, detail_list.dob, election_list.voted, election_list.post_sent, election_list.post_received, election_list.token_number, election_list.mode from name_list inner join detail_list on name_list.id=detail_list.id inner join election_list on name_list.id=election_list.id ${searchQuery} ${sortQuery} `;
  if (limitQuery) {
    Query = `${Query} ${limitQuery};`;
  } else {
    Query = Query + `;`;
  }
  db.query(Query, (err, rows) => {
    if (err) {
      res.status(404).send(err);
    } else {
      res.status(200).send(rows);
    }
  });
});

app.get('/api/online', (req, res) => {
  const { sortQuery, limitQuery, searchQuery } = getQueryVariables(
    req.query,
    'online'
  );

  let Query = `select name_list.id, name_list.member_name, name_list.father_name, detail_list.phone, detail_list.address, detail_list.whatsapp, detail_list.photo, detail_list.mother_name, detail_list.dob, election_list.voted, election_list.post_sent, election_list.post_received, election_list.token_number, election_list.mode from name_list inner join detail_list on name_list.id=detail_list.id inner join election_list on name_list.id=election_list.id ${searchQuery} ${sortQuery}`;
  if (limitQuery) {
    Query = `${Query} ${limitQuery};`;
  } else {
    Query = Query + ';';
  }
  db.query(Query, (err, rows) => {
    if (err) {
      res.status(404).send(err);
    } else {
      res.status(200).send(rows);
    }
  });
});

app.get('/api/offline', (req, res) => {
  const { sortQuery, limitQuery, searchQuery } = getQueryVariables(
    req.query,
    'offline'
  );

  let Query = `select name_list.id, name_list.member_name, name_list.father_name, detail_list.phone, detail_list.address, detail_list.whatsapp, detail_list.photo, detail_list.mother_name, detail_list.dob, election_list.voted, election_list.post_sent, election_list.post_received, election_list.token_number, election_list.mode from name_list inner join detail_list on name_list.id=detail_list.id inner join election_list on name_list.id=election_list.id ${searchQuery} ${sortQuery}`;
  if (limitQuery) {
    Query = `${Query} ${limitQuery};`;
  } else {
    Query = Query + ';';
  }
  db.query(Query, (err, rows) => {
    if (err) {
      res.status(404).send(err);
    } else {
      res.status(200).send(rows);
    }
  });
});

app.get('/api/count', (req, res) => {
  let GetVotedCountQuery = `select count(id) as total from election_list where voted = 1;`;
  db.query(GetVotedCountQuery, (err, rows) => {
    if (err) {
      res.sendStatus(500);
    } else {
      res.status(200).json(rows[0].total);
    }
  });
});

app.post('/api/add', (req, res) => {
  if (req.body && !req.body.member_name) {
    res.status(422).send('Member name is required');
  }
  if (req.body && !req.body.father_name) {
    res.status(422).send('Father name is required');
  }
  if (req.body && !req.body.id) {
    res.status(422).send('ID is required');
  }

  const { NameQuery, DetailsQuery } = constructAddQuery(req.body)

  db.query(NameQuery, (err, rows) => {
    if (err) {
      res.status(404).send(err);
    } else {
      db.query(DetailsQuery, (err, rows) => {
        if (err) {
          res.status(404).send(err);
        } else {
          db.query(
            `insert into election_list (id) values (${req.body.id});`,
            (err, rows) => {
              if (err) {
                res.status(404).send(err);
              } else {
                res.status(200).send('Record Created');
              }
            }
          );
        }
      });
    }
  });
});

app.post('/api/update/vote/:id', (req, res) => {
  const { id } = req.params;
  let { voted, mode } = req.body;
  let GetVotedCountQuery = `select count(id) as total from election_list where voted = 1;`;
  db.query(GetVotedCountQuery, (err, rows) => {
    if (rows) {
      mode = voted ? mode : null;
      let token_number = voted ? rows[0].total + 1 : 0;
      db.query(
        'UPDATE election_list SET voted=?,token_number=?,mode=? WHERE id = ?',
        [voted, token_number, mode, id],
        (error, results) => {
          if (error && error.message) {
            res.sendStatus(500);
          } else {
            res.send({ mode, voted, token_number }).status(200);
          }
        }
      );
    }
  });
});

app.post('/api/login', (req, res) => {
  const { userName, password } = req.body;
  let getUser = `select password, profile, member_name from user_list where username = ?;`;
  db.query(getUser, [userName], (err, rows) => {
    if (rows) {
      rows.forEach(i => {
        if (i.password === password) {
          res.statusMessage = JSON.stringify({
            member_name: i.member_name,
            profile: i.profile,
            id: userName
          });
          res.sendStatus(200)
        } else {
          res.sendStatus(500)
        }
      });
    } else {
      res.sendStatus(500)
    }
  });
})

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`listening on ${port}`));