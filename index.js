const express = require('express');
const mysql = require('mysql');
const parser = require('body-parser');
const cors = require('cors');

const app = express();
var myLogger = function (req, res, next) {
  console.log(req.url, req.body, req.params, req.query);
  next();
};
app.use([myLogger]);
app.use(parser.json());
app.use(cors());

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'dummyData',
  // database: 'sabhaApp',
});

app.get('/api/user', (req, res) => {
  db.query('select * from user_list;', (err, result) => {
    if (err) {
      res.status(404).send('Error', err);
    } else {
      res.status(200).send(result);
    }
  });
});

app.get('/api/member', (req, res) => {
  const { sort = 'id%asc', word = '%member_name', limit } = req.query;

  const sortFrom = sort.split('%')[0];
  const sortBy = sort.split('%')[1];
  const sortQuery = `order by ${sortFrom} ${sortBy}`;

  let searchQuery = `where `;
  const wordList = word.split(',');
  wordList.forEach((word, index) => {
    const searchStr = word.split('%')[0];
    const searchFrom = word.split('%')[1];
    if (wordList.length - 1 !== index) {
      searchQuery += `${searchFrom} like '%${searchStr}%' and `;
    } else {
      searchQuery += `${searchFrom} like '%${searchStr}%' `;
    }
  });

  const limitQuery = `limit ${parseInt(limit)}`;

  let Query = `select * from name_list ${searchQuery} ${sortQuery}`;
  if (limit) {
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

function getQueryVariables(query, condition) {
  const { sort = 'id%asc', word = '%member_name', limit } = query;

  const sortFrom = sort.split('%')[0];
  const sortBy = sort.split('%')[1];
  const sortQuery = `order by ${sortFrom} ${sortBy}`;

  let searchQuery =
    condition === 'online'
      ? `where (detail_list.address NOT LIKE '%dindigul%') and `
      : condition === 'offline'
        ? `WHERE (detail_list.address IS NULL OR detail_list.address LIKE '%dindigul%') and `
        : `where `;
  const wordList = word.split(',');
  wordList.forEach((word, index) => {
    const searchStr = word.split('%')[0];
    let searchFrom = word.split('%')[1];
    if (searchFrom === 'id') {
      searchFrom = 'name_list.id';
    }
    if (wordList.length - 1 !== index) {
      searchQuery += `${searchFrom} like '%${searchStr}%' and `;
    } else {
      searchQuery += `${searchFrom} like '%${searchStr}%' `;
    }
  });

  const limitQuery = limit ? `limit ${limit}` : null;
  return { sortQuery, limitQuery, searchQuery };
}

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

  let NameQuery = `insert into name_list (id, member_name, member_name) values (${req.body.id}, ${req.body.member_name}, ${req.body.father_name});`;
  let DetailsQuery = `insert into detail_list (id, address, phone, whatsapp, email_id, descendant, marital_status, spouse_name, gher_navu, gothru, dob, photo, custom_field) values (${req.body.id
    }, ${req.body.address}, ${req.body.phone}, ${req.body.whatsapp}, ${req.body.email_id
    }, ${req.body.descendant}, ${req.body.marital_status}, ${req.body.spouse_name
    }, ${req.body.gher_navu}, ${req.body.gothru}, ${req.body.dob}, ${req.body.photo
    }, ${req.body.custom_field}, ${new Date()});`;

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
      if (password === rows[0].password)
        res.status(200).json({ member_name: rows[0].member_name, profile: rows[0].profile });
      res.send('Error Occured').sendStatus(500);
    } else {
      res.send('Error Occured').sendStatus(500);
    }
  });
})

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`listening on ${port}`));