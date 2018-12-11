/**** imports *****/
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../config');
const jwtSecret = require('../secure/jwtSecret');
const router = express.Router();

const emailRegex = require('../secure/emailRegex');

router.route('/signin/:userType')
  /**
   * Sign in for companies. Gets the company id from the email if password matches.
   * Creates a token with jwt
   */
  .post((req, res) => {
    //Gets id and password corresponding to the email
    const sql = `SELECT id, password FROM ?? WHERE email = ?`;
    const sqlData = [req.params.userType, req.body.email];
    connection.query(sql, sqlData , (err, results) => {
      if (err) {
        res.status(500).send(`Erreur serveur : ${err}`)
      } else {
        if (results.length){
          bcrypt.compare(req.body.password, results[0].password, (cryptErr, match) => {
            if (cryptErr) res.sendStatus(500);
            if (match) {
              // créer token jwt
              const tokenInfo = {
                name: results[0].name,
                role: req.params.userType,
                id: results[0].id
              }
              const token = jwt.sign(tokenInfo, jwtSecret);
              res.header("Access-Control-Expose-Headers", "x-access-token")
              res.set("x-access-token", token)
              res.status(200)
              res.send({
                info: 'user connected',
                id: results[0].id
              })
            } else {
              res.status(403).send('le mot de passe est incorrect')
            }
          });
        } else {
          res.status(403).send('email inconnu')
        }               
      }
    });
  })

router.route('/signup/:userType')
/**
 * Sign up 
 */
  .post((req, res) => {
    bcrypt.hash(req.body.password, 10, (crypErr, hash) => {
      if (crypErr) res.sendStatus(500);
      if (!emailRegex.test(req.body.email)) res.status(403).send('email non valide');
      else {
        const dataForm = {
          ...req.body,
          id : null,
          created_at: new Date(),
          updated_at: new Date(),
          is_active: 1,
          password: hash
        };
        const sql = `INSERT INTO ?? SET ?`;
        const sqlData = [req.params.userType, dataForm];
        connection.query(sql, sqlData, (err, results) => {
          if (err) res.status(200).send({error : err})
          else {
            res.json({id: results.insertId})
          }
        });
      }      
    });
  })

module.exports = router;