var quickCartManagerApp = angular.module('QuickCartManager', []);

window.onload = function () {
	var pathfindingMapCanvas = document.getElementById('pathfindingMapCanvas');
	var pathfindingMapContext = pathfindingMapCanvas.getContext('2d');
	pathfindingMapContext.drawImage(document.getElementById('pathfindingMapImage'), 0, 0);

	var mainMapCanvas = document.getElementById('mainMapCanvas');
	var mainMapContext = mainMapCanvas.getContext('2d');
	mainMapContext.drawImage(document.getElementById('mainMapImage'), 0, 0);
};

quickCartManagerApp.controller('QuickCartController', function ($scope, $http) {
	scope = $scope;
	$scope.view = 'now';
	$scope.inventories = {};

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
			if (apply)
				$scope.$apply();
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
});
