var app = angular.module('SinglePage', []);

app.controller('productFeatureController', function($scope) {
	$scope.products=products;
	$scope.formatPrice = function(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	$scope.isFavoriteProduct = function(id) {
		return isFavoriteProduct(id);
	};

	$scope.gaSend = function(id) {
     	customGA('ArticleDetail', 'ProductFeatureClick', id.toString());
   	};
});

function formatTime(num) {
	return num<10 ? ('0'+num) : (''+num);
}

var dateDetail=new Date();
dateDetail.setTime(mainTime);
$("#time-article").text(""+dateDetail.getHours()+":"+formatTime(dateDetail.getMinutes())+" "+dateDetail.getDate()+"/"+(dateDetail.getMonth()+1)+"/"+dateDetail.getFullYear());

function share() {
	FB.ui({
		method: 'share',
		href: window.location.href
	}, function(response){
		if (response && !response.error_message) {
			var scope = angular.element(document.getElementById('facebookElement')).scope();
			scope.updateShare();
		}
	});
}

function updateComment() {
	var scope = angular.element(document.getElementById('facebookElement')).scope();
	scope.updateComment();
}

app.controller('facebookController', function($scope,$http) {
	$scope.updateComment = function() {
		$http({
			method: 'PUT',
			url: "https://api.doraeshop.vn/v1/update-comment/"+mainId,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8'
			}})
		.then(function(response) {
			
		});
	};

	$scope.updateShare = function() {
		$http({
			method: 'PUT',
			url: "https://api.doraeshop.vn/v1/update-share/"+mainId,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8'
			}})
		.then(function(response) {
			var shareNumber=parseInt($("#share-number").text())+1;
			$("#share-number").text(shareNumber.toString());
		});
	};
});