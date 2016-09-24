var pg = require('pg');
var express = require('express');
var bodyParser = require('body-parser');
var socketIo = require('socket.io');
var config = require('config');

var app = express();
app.use(bodyParser.urlencoded({
	extended: true
}));
var server = require('http').Server(app);
var io = socketIo(server);

var POSTGRES_CONFIG = config.get('postgres');
var PSQL_STRING = 'postgres://' + POSTGRES_CONFIG.username + ':' + POSTGRES_CONFIG.password + '@' + POSTGRES_CONFIG.host + '/' + POSTGRES_CONFIG.database;

app.get('/inventories/:id', function (req, res) {
	// TODO: authenticate
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			res.status(500).send();
			return;
		}

		client.query('SELECT p.id, p.name, p.info, p.price, iit.timestamp FROM products p'
						+ ' INNER JOIN items it ON (it.product_id = p.id)'
						+ ' INNER JOIN inventory_items iit ON (iit.item_id = it.id)'
						+ ' WHERE iit.inventory_id = $1'
						+ ' ORDER BY iit.timestamp DESC',
						[req.params.id],
			function (error, q_products) {
				done();
				if (error) {
					console.error(error);
					res.status(500).send();
					return;
				}

				var idIndices = new Map();
				var nextIndex = 0;
				var products = [];

				for (var i = 0; i < q_products.rows.length; i++) {
					if (idIndices.has(q_products.rows[i].id)) {
						products[idIndices.get(q_products.rows[i].id)].quantity++;
					} else {
						idIndices.set(q_products.rows[i].id, nextIndex)
						products[nextIndex] = q_products.rows[i];
						products[nextIndex].quantity = 1;
						nextIndex++;
					}
				}

				res.status(200).send({"products": products.map(function (obj) {
					obj.info = JSON.parse(obj.info);
					return obj;
				})});
			}
		);
	});	
});

app.get('/coupons', function (req, res) {
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			res.status(500).send();
			return;
		}

		client.query('SELECT * FROM coupons', function (error, q_coupons) {
			done();
			if (error) {
				console.error(error);
				res.status(500).send();
				return;
			}

			res.status(200).send({"coupons": q_coupons.rows});
		});
	});
});

app.post('/scan-tag/:inventory', function (req, res) {
	console.log(req.params.inventory, req.body.uid);
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			res.status(500).send();
			return;
		}

		client.query('INSERT INTO inventory_items(inventory_id, item_id, timestamp) VALUES ($1, (SELECT id FROM items WHERE uid=$2), $3)', [req.params.inventory, req.body.uid, +new Date()], function (error, q_scan) {
			done();
			if (error) {
				console.error(error);
				res.status(500).send();
				return;
			}

			res.status(200).send();
		});
	});
});

server.listen(6649, function () {
	console.log('Server is running!');
});
