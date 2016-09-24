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
			return;
		}

		client.query('SELECT DISTINCT p.id, p.name, p.info, p.location FROM products p'
						+ ' INNER JOIN items it ON (it.product_id = p.id)'
						+ ' INNER JOIN inventory_items iit ON (iit.item_id = it.id)'
						+ ' WHERE iit.inventory_id = $1',
						[req.params.id],
			function (error, q_products) {
				done();
				if (error) {
					console.error(error);
					return;
				}

				client.query('SELECT it.id AS item_id, p.id AS product_id FROM products p'
						+ ' INNER JOIN items it ON (it.product_id = p.id)'
						+ ' INNER JOIN inventory_items iit ON (iit.item_id = it.id)'
						+ ' WHERE iit.inventory_id = $1',
							[req.params.id],
					function (error, q_inventories) {
						done();
						if (error) {
							console.error(error);
							return;
						}

						res.status(200).send({"products": q_products.rows, "items": q_inventories.rows});
					}
				);
			}
		);
	});	
});

app.get('/coupons', function (req, res) {
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			return;
		}

		client.query('SELECT * FROM coupons', function (error, q_coupons) {
			done();
			if (error) {
				console.error(error);
				return;
			}

			res.status(200).send({"coupons": q_coupons.rows});
		});
	});
});

app.post('/scan-tag', function (req, res) {
	console.log(req.body);
	res.status(200).send();
});

server.listen(6649, function () {
	console.log('Server is running!');
});
