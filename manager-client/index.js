var quickCartManagerApp = angular.module('QuickCartManager', []);

var lastPositions = {};
var pathfindingMapScalingFactor = 5;

window.onload = function () {
	var pathfindingMapCanvas = document.getElementById('pathfindingMapCanvas');
	var pathfindingMapContext = pathfindingMapCanvas.getContext('2d');
	pathfindingMapContext.drawImage(document.getElementById('pathfindingMapImage'), 0, 0);

	var mainMapCanvas = document.getElementById('mainMapCanvas');
	var mainMapContext = mainMapCanvas.getContext('2d');
	var mainMapImage = document.getElementById('mainMapImage');

	var renderMainCanvas = function () {
		mainMapContext.drawImage(mainMapImage, 0, 0);

		for (let ind in lastPositions) {
			let x = pathfindingMapScalingFactor * lastPositions[ind][0];
			let y = pathfindingMapScalingFactor * lastPositions[ind][1];

			mainMapContext.fillStyle = 'black';

			mainMapContext.beginPath();
			mainMapContext.arc(x, y, 11, 0, 2 * Math.PI);
			mainMapContext.fill();

			let hue = 61 * ind % 360;
			mainMapContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';

			mainMapContext.beginPath();
			mainMapContext.arc(x, y, 10, 0, 2 * Math.PI);
			mainMapContext.fill();
		}

		window.requestAnimationFrame(renderMainCanvas);
	};

	renderMainCanvas();
};

quickCartManagerApp.controller('QuickCartController', function ($scope, $http) {
	scope = $scope;
	$scope.view = 'now';
	$scope.inventories = {};
	$scope.activeInventory = -1;

	$http({
		method: 'GET',
		url: '/products'
	}).then(function (response) {
		$scope.products = response.data.products;
	}, function () {});

	$http({
		method: 'GET',
		url: '/events'
	}).then(function(response) {
		$scope.events = response.data.events;
		var inventories = new Set();
		for (let event of $scope.events) {
			inventories.add(event.data.inventory);
		}

		inventories.forEach(function (i) {
			fetchInventory(i);
		});

		var socket = io('http://quickcart.me');
		socket.on('connect', function () {
			socket.emit('register as manager');
		});

		socket.on('event', function (data) {
			$scope.events.push(data);
			fetchInventory(data.data.inventory, true);

			$scope.$apply();
		});
	}, function () {});

	function fetchInventory(inventory, apply) {
		$http({
			method: 'GET',
			url: '/inventories/' + inventory
		}).then(function (response2) {
			$scope.inventories[inventory] = response2.data;
			if (response2.data.products.length > 0)
				lastPositions[inventory] = response2.data.products[0].location.split(',').map((s) => parseInt(s));
			if (apply)
				window.setTimeout(function () {$scope.$apply()}, 0);
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
		if (id == $scope.activeInventory) {
			$scope.activeInventory = -1;
		} else {
			$scope.activeInventory = id;
		}
	};
});
