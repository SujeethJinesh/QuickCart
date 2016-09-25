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
var io = socketIo.listen(server);

var POSTGRES_CONFIG = config.get('postgres');
var PSQL_STRING = 'postgres://' + POSTGRES_CONFIG.username + ':' + POSTGRES_CONFIG.password + '@' + POSTGRES_CONFIG.host + '/' + POSTGRES_CONFIG.database;

var inventoryPhoneSockets = new Map();
var managerSocket = null;

app.get('/inventories/:id', function (req, res) {
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			res.status(500).send();
			return;
		}

		client.query('SELECT p.id, p.name, p.info, p.location, p.price, iit.timestamp, (SELECT name AS inv_name FROM inventories WHERE id = iit.inventory_id), (SELECT id AS inv_id FROM inventories WHERE id = iit.inventory_id) FROM products p'
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

				var invName, invId;
				if (q_products.rows.length > 0) {
					invName = q_products.rows[0].inv_name;
					invId = q_products.rows[0].inv_id;
				}

				res.status(200).send({"products": products.map(function (obj) {
					obj.info = JSON.parse(obj.info);
					obj.inv_name = undefined;
					return obj;
				}), "name": invName, "id": invId});
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
	if (req.body.uid == '0492556ACA4880') {
		inventoryPhoneSockets.get(parseInt(req.params.inventory)).emit('termination');
		res.status(200).send();
		return;
	}

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

			addItemEvent(parseInt(req.params.inventory), req.body.uid);

			res.status(200).send();
		});
	});
});

io.on('connection', function (socket) {
	var inventory = null;

	socket.on('register inventory', function (data) {
		inventory = data;
		inventoryPhoneSockets.set(inventory, socket);
	});

	socket.on('register as manager', function () {
		managerSocket = socket;
	})
});

function addItemEvent(inventory, uid) {
	console.log('add item', inventory, uid);
	var socket = null;
	if (inventoryPhoneSockets.has(inventory)) {
		socket = inventoryPhoneSockets.get(inventory);
	}

	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			return;
		}

		client.query('SELECT product_id FROM items WHERE uid=$1', [uid], function (error, q_productId) {
			if (error) {
				console.error(error);
				return;
			}

			if (q_productId.rows.length == 0) return;

			if (socket !== null) {
				sendInventoryUpdate(inventory, socket);
			}

			createEvent("add item", JSON.stringify({
				inventory: inventory,
				item: uid,
				product_id: q_productId.rows[0]
			}));
		});
	});
};

function sendInventoryUpdate(inventory, socket) {
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			return;
		}

		client.query('SELECT p.id, p.name, p.info, p.price, iit.timestamp, (SELECT name AS inv_name FROM inventories WHERE id = iit.inventory_id), (SELECT id AS inv_id FROM inventories WHERE id = iit.inventory_id) FROM products p'
					+ ' INNER JOIN items it ON (it.product_id = p.id)'
					+ ' INNER JOIN inventory_items iit ON (iit.item_id = it.id)'
					+ ' WHERE iit.inventory_id = $1'
					+ ' ORDER BY iit.timestamp DESC',
					[inventory],
		function (error, q_products) {
			done();
			if (error) {
				console.error(error);
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

			var invName, invId;
			if (q_products.rows.length > 0) {
				invName = q_products.rows[0].inv_name;
				invId = q_products.rows[0].invId;
			}

			socket.emit('inventory update', {"products": products.map(function (obj) {
				obj.info = JSON.parse(obj.info);
				return obj;
			}), name: invName, id: invId});
		});
	});
}

app.get('/events', function (req, res) {
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			res.status(500).send();
			return;
		}

		client.query('SELECT timestamp, type, data FROM events', function (error, q_events) {
			done();
			if (error) {
				console.error(error);
				res.status(500).send();
				return;
			}

			res.status(200).send({events: q_events.rows.map(function (obj) {
				obj.data = JSON.parse(obj.data);
				return obj;
			})});
		});
	});
});

app.get('/products', function (req, res) {
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			res.status(500).send();
			return;
		}

		client.query('SELECT *, (SELECT COUNT(*) FROM items i WHERE i.product_id = p.id) FROM products p', function (error, q_products) {
			done();
			if (error) {
				console.error(error);
				res.status(500).send();
				return;
			}

			res.status(200).send({products: q_products.rows.map(function (obj) {
				obj.count = parseInt(obj.count);
				obj.info = JSON.parse(obj.info);
				return obj;
			})});
		});
	});
});

function createEvent(type, data) {
	pg.connect(PSQL_STRING, function (error, client, done) {
		if (error) {
			console.error(error);
			return;
		}

		var timestamp = +new Date();

		client.query('INSERT INTO events(timestamp, type, data) VALUES ($1, $2, $3)', [timestamp, type, data], function (error, q_insertion) {
			done();
			if (error) {
				console.error(error);
				return;
			}

			if (managerSocket !== null) {
				managerSocket.emit('event', {
					timestamp: timestamp,
					type: type,
					data: JSON.parse(data)
				});
			}
		});
	});
}

server.listen(6649, function () {
	console.log('Server is running!');
});
