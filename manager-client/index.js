var quickCartManagerApp = angular.module('QuickCartManager', []);

var lastPositions = {};
var pathfindingMapScalingFactor = 5;
var activeInventory = -1;
var pathSoFar = {};

var grid;

var startLocation = [196,131];

window.onload = function () {
	var pathfindingMapCanvas = document.getElementById('pathfindingMapCanvas');
	var pathfindingMapContext = pathfindingMapCanvas.getContext('2d');
	var pathfindingMapImage = document.getElementById('pathfindingMapImage');
	pathfindingMapContext.drawImage(pathfindingMapImage, 0, 0);

	grid = new PF.Grid(pathfindingMapImage.width, pathfindingMapImage.height);
	var pathData = pathfindingMapContext.getImageData(0, 0, pathfindingMapImage.width, pathfindingMapImage.height).data;

	for (let x = 0; x < pathfindingMapImage.width; x++) {
		for (let y = 0; y < pathfindingMapImage.height; y++) {
			let pixIndex = 4 * Math.floor(y * pathfindingMapImage.width + x);

			if (pathData[pixIndex] === 0 && pathData[pixIndex + 1] === 0 && pathData[pixIndex + 2] === 0) {
				grid.setWalkableAt(x, y, false);
			}
		}
	}

	var mainMapCanvas = document.getElementById('mainMapCanvas');
	var mainMapContext = mainMapCanvas.getContext('2d');
	var mainMapImage = document.getElementById('mainMapImage');

	var renderMainCanvas = function () {
		mainMapContext.drawImage(mainMapImage, 0, 0);

		if (activeInventory === -1) {
			renderAllPeople();
		} else {
			renderPersonPath();
		}

		window.requestAnimationFrame(renderMainCanvas);
	};

	renderMainCanvas();

	function renderAllPeople() {
		for (let ind in lastPositions) {
			renderSingleCircle(ind);
		}
	}

	function renderSingleCircle(ind) {
		let x = pathfindingMapScalingFactor * lastPositions[ind][0];
		let y = pathfindingMapScalingFactor * lastPositions[ind][1];

		mainMapContext.fillStyle = 'black';

		mainMapContext.beginPath();
		mainMapContext.arc(x, y, 11, 0, 2 * Math.PI);
		mainMapContext.fill();

		let hue = (124 * ind + 45) % 360;
		mainMapContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';

		mainMapContext.beginPath();
		mainMapContext.arc(x, y, 10, 0, 2 * Math.PI);
		mainMapContext.fill();
	}

	function renderPersonPath() {
		if (!pathSoFar[activeInventory] || pathSoFar[activeInventory].length < 2) return;

		/*mainMapContext.strokeStyle = '3px solid black';	
		mainMapContext.beginPath();
		mainMapContext.moveTo(pathSoFar[activeInventory][0][0] * pathfindingMapScalingFactor, pathSoFar[activeInventory][0][1] * pathfindingMapScalingFactor);
		for (let i = 1; i < pathSoFar[activeInventory].length; i++) {
			mainMapContext.lineTo(pathSoFar[activeInventory][i][0] * pathfindingMapScalingFactor, pathSoFar[activeInventory][i][1] * pathfindingMapScalingFactor);
		}
		mainMapContext.stroke();*/

		var path = scope.events;
		path = path.filter((event) => event.data.inventory === activeInventory && event.type === 'add item');

		var drawPoints = pathSoFar[activeInventory].map(
			(pair) => {
				return {
					x: pair[0] * pathfindingMapScalingFactor,
					y: pair[1] * pathfindingMapScalingFactor
				}
			});

		mainMapContext.fillStyle = 'black';
		for (let waypoint of path) {
			var point = getLoc(waypoint.data.product_id.product_id).split(',').map((n) => parseInt(n));
			mainMapContext.beginPath();
			mainMapContext.arc(point[0] * pathfindingMapScalingFactor, point[1] * pathfindingMapScalingFactor, 5, 0, Math.PI * 2);
			mainMapContext.fill();
		}

		mainMapContext.moveTo(drawPoints[0].x, drawPoints[0].y);


		for (i = 1; i < drawPoints.length - 2; i ++) {
			var xc = (drawPoints[i].x + drawPoints[i + 1].x) / 2;
			var yc = (drawPoints[i].y + drawPoints[i + 1].y) / 2;
			mainMapContext.quadraticCurveTo(drawPoints[i].x, drawPoints[i].y, xc, yc);
		}
		// curve through the last two drawPoints
		 mainMapContext.quadraticCurveTo(drawPoints[i].x, drawPoints[i].y, drawPoints[i+1].x,drawPoints[i+1].y);

						mainMapContext.lineWidth = 3;
						mainMapContext.strokeStyle = '#550000';
						mainMapContext.stroke();

		renderSingleCircle(activeInventory);
	}
};

function getLoc (pid) {
	for (let product of scope.products) {
		if (product.id === pid)
			return product.location;
	}
};

function prePathfind () {
	var path = scope.events;
	path = path.filter((event) => event.type === 'add item');

	for (let waypoint of path) {
		pathfindTo(waypoint.data.inventory, getLoc(waypoint.data.product_id.product_id).split(',').map((n) => parseInt(n)));
	}
}

function pathfindTo (inventory, waypointDestination) {
	if (pathSoFar[inventory] === undefined) {
		pathSoFar[inventory] = [startLocation];
	}

	var finder = new PF.AStarFinder({
		allowDiagonal: true,
		heuristic: PF.Heuristic.euclidean
	});

	var workingGrid = grid.clone();

	var lastPoint = pathSoFar[inventory][pathSoFar[inventory].length - 1];
	//var path = PF.Util.smoothenPath(workingGrid, finder.findPath(lastPoint[0], lastPoint[1], waypointDestination[0], waypointDestination[1], workingGrid));
	var path = finder.findPath(lastPoint[0], lastPoint[1], waypointDestination[0], waypointDestination[1], workingGrid);
	path = path.slice(1);
	path.forEach((point) => pathSoFar[inventory].push(point));
}

quickCartManagerApp.controller('QuickCartController', function ($scope, $http) {
	scope = $scope;
	$scope.view = 'now';
	$scope.inventories = {};

	$scope.activeProduct = null;

	$http({
		method: 'GET',
		url: '/products'
	}).then(function (response) {
		$scope.products = response.data.products;

		$http({
			method: 'GET',
			url: '/events'
		}).then(function(response) {
			$scope.events = response.data.events;
			var inventories = new Set();
			for (let event of $scope.events) {
				inventories.add(event.data.inventory);
			}

			prePathfind();

			inventories.forEach(function (i) {
				fetchInventory(i);
			});

			var socket = io('http://quickcart.me');
			socket.on('connect', function () {
				socket.emit('register as manager');
			});

			socket.on('event', function (data) {
				$scope.events.push(data);
				fetchInventory(data.data.inventory);
				if (data.type === 'add item') {
					pathfindTo(data.data.inventory, getLoc(data.data.product_id.product_id).split(',').map((n) => parseInt(n)));
				}

				$scope.$apply();
			});
		}, function () {});
	}, function () {});

	function fetchInventory(inventory, apply) {
		$http({
			method: 'GET',
			url: '/inventories/' + inventory
		}).then(function (response2) {
			$scope.inventories[inventory] = response2.data;
			if (response2.data.products.length > 0)
				lastPositions[inventory] = response2.data.products[0].location.split(',').map((s) => parseInt(s));
		}, function () {});
	}

	$scope.countItems = function (products) {
		var total = 0;
		for (var product of products) {
			total += product.quantity;
		}

		return total;
	}

	$scope.calculateTotal = function (products) {
		var total = 0;
		for (var product of products) {
			total += product.quantity * parseFloat(product.price);
		}

		return total;
	};

	$scope.setActiveInventory = function (id) {
		if (id == activeInventory) {
			activeInventory = -1;
		} else {
			activeInventory = id;
		}
	};

	$scope.getActiveInventory = function () {
		return activeInventory;
	};

	$scope.inSearch = function (name, search) {
		if (name.search(new RegExp(search, 'i')) != -1) {
			return true;
		} else {
			return false;
		}
	};

	$scope.textColor = function (id) {
		let hue = (124 * id + 45) % 360;
		return 'hsl(' + hue + ', 100%, 25%)';
	};

	var barData = [
		[],
		[30, 40, 33, 60, 14],
		[4, 24, 10, 34, 90],
		[50, 47, 32, 50, 48],
		[71, 43, 20, 32, 6],
		[40, 33, 60, 14, 31],
		[41, 40, 13, 20, 64],
		[33, 40, 33, 6, 4],
		[55, 41, 67, 12, 33],
		[22, 49, 4, 4, 34],
		[25, 42, 53, 61, 56]
	]

	$scope.setActiveProduct = function (product) {
		$scope.activeProduct = product;
		$scope.view = 'products';

		document.getElementById('chartContainer').innerHTML = '<canvas id="chartCanvas" width="800" height="400"></canvas>';

		new Chart(document.getElementById('chartCanvas').getContext('2d'), {
			type: 'bar',
			data: {
				labels: ['0-1 minute', '1-3 minutes', '3-5 minutes', '5-10 minutes', '10+ minutes'],
				datasets: [
					{
						label: 'Number of customers',
						backgroundColor: [
			                'rgba(255, 99, 132, 0.2)',
			                'rgba(54, 162, 235, 0.2)',
			                'rgba(255, 206, 86, 0.2)',
			                'rgba(75, 192, 192, 0.2)',
			                'rgba(153, 102, 255, 0.2)',
			                'rgba(255, 159, 64, 0.2)'
			            ],
			            borderColor: [
			                'rgba(255,99,132,1)',
			                'rgba(54, 162, 235, 1)',
			                'rgba(255, 206, 86, 1)',
			                'rgba(75, 192, 192, 1)',
			                'rgba(153, 102, 255, 1)',
			                'rgba(255, 159, 64, 1)'
			            ],
			            borderWidth: 1,
						data: barData[product.id]
					}
				]
			},
			options: {
				responsive: false
			}
		})
	}
});
