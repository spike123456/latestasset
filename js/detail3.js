var extra="";
var cacheOption=null;
var isHiding=false;

function updateStatusFavorite() {
	var itemIDs=localStorage.FavoriteList;
	var ids=[];
	if (itemIDs!=null) {
		ids=itemIDs.split(",");
	}

	if (ids.includes(detailId.toString())) {
		$("#bookmark-product").text("Bỏ yêu thích");
		return true;
	}

	$("#bookmark-product").text("Yêu thích");
	return false;
}

var liked=updateStatusFavorite();

var app = angular.module('SinglePage', []);
app.controller('thumbnailController', function($scope) {
    // init paging list
    $scope.currentGallery=0;

    $scope.thumbnailArr=mainThumbnail;

    $scope.handleThumbnailClick = function(pos,link) {
    	customGA('Detail', 'Images', 'Thumbnail');
    	$scope.currentGallery=pos;
    	$("#main-product-image").attr("src",link);
    };

    $scope.handleThumbnailMiniClick = function() {
    	var pswpElement = document.querySelectorAll('.pswp')[0];

    	var items=[];
    	for (var i = 0; i <$scope.thumbnailArr.length; i++) {
    		items.push({
    			src:$scope.thumbnailArr[i],
    			w:600,
    			h:600
    		});
    	}

    	// define options (if needed)
    	var options = {
    		index:$scope.currentGallery,
    		history: false,
    		focus: false,

    		showAnimationDuration: 0,
    		hideAnimationDuration: 0

    	};

    	customGA('Detail', 'Images', 'Slider');
    	var gallery = new PhotoSwipe(pswpElement, PhotoSwipeUI_Default, items, options);
    	gallery.init();
    };

    $scope.handleThumbnailClick(0,$scope.thumbnailArr[0]);
});

app.controller('overSellController', function($scope,$http) {
	$scope.send = function() {
		$http({
			method: 'POST',
			url: "https://api.doraeshop.vn/v1/send-info-oversell",
			data: {
				"name":$("#oversell-name").val(),
				"phone":$("#oversell-phone").val(),
				"title":$("#title").text(),
				"extra":extra
			},
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			}})
		.then(function(response) {
			$('#oversell-modal').data('bs.modal').backdrop = true;
			$('#oversell-modal').data('bs.modal')._config.backdrop = true;
			$('#oversell-modal').data('bs.modal').keyboard = false;
			$("#oversell-footer-modal").css("display","block");
			$("#oversell-sending").css("display","none");
			isHiding=true;
			$('#oversell-modal').modal('hide');
			showToast("success","Thông báo","Gửi yêu cầu thành công. Chúng tôi sẽ liên lạc lại với bạn ngay khi có hàng.");
		});
	};
});


app.controller('priceController', function($scope) {
	$scope.price=0;
	$scope.realPrice=0;
	$scope.discount=0;
	$scope.discountPercent=0;


	$scope.$on('onPriceChanged', function(event, args) {
		var data=args.data;
		$scope.price=data.price;
		mutablePriceValue=data.price;
		$scope.realPrice=data.realPrice;
		$scope.discount=data.realPrice-data.price;
		$scope.discountPercent=Math.round($scope.discount*100/data.realPrice);
	});

	$scope.formatPrice = function(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};
});


app.controller('optionController', function($scope,$rootScope) {
	for (i = 0; i < serverOptions.length; i++) { 
		serverOptions[i].currentOption=0;
	}
	$scope.options=serverOptions;
	$scope.optionList=serverOptionList;

	$scope.generateNewExtra = function() {
		var arr=[];
		for (i = 0; i < $scope.options.length; i++) { 
			arr.push($scope.options[i].currentOption);
		}

		if ($scope.options.length!=0) {
			var extras=[];

			for (i = 0; i < $scope.options.length; i++) { 
				var item=$scope.options[i];
				extras.push(item.data[item.currentOption]);
			}

			if (extras.length!=0) {
				extra=extras.join(", ");
			}

			cacheOption=arr.join("-");
		}

		$rootScope.$broadcast('onPriceChanged', {
			data:$scope.optionList[arr.join("-")]
		});
	};

	$scope.handleOptionClick = function(optionPos,pos) {
		$scope.options[optionPos].currentOption=pos;

		$scope.generateNewExtra();
	};

	$scope.generateNewExtra();
});


app.controller('latestController', function($scope,$http) {
	$http({
		method: 'GET',
		url: "https://data.doraeshop.vn/api/v1/lastest-product.json",
		headers: {
			'Content-Type': 'application/json; charset=utf-8'
		}})
	.then(function(response) {
		var categoriesData=response.data.data;
		for (i = 0; i < categoriesData.length; i++) {
			var bigItem=categoriesData[i];
			for (j = 0; j < bigItem.subCategories.length; j++) {
				var item=bigItem.subCategories[j];
				if (item.subCategoryId==detailSubCategory) {
					i=100;
					j=100;
					var numOfExpectedElement=8;
					var list=item.data.slice(0,numOfExpectedElement+1);
					var arr=[];
					for (index = 0; index < list.length; index++) {
						if (list[index].id!=detailId) {
							arr.push(list[index]);
						}
					}

					if (arr.length==list.length) {
						arr=arr.slice(0,arr.length-1);
					}
				}
			}
		}

		$('#loading-latest-product').remove();
		$('#latest-product').css("display","block");
		$scope.latest=arr;

		$scope.formatPrice = function(num) {
			return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		};

		$scope.isFavoriteProduct = function(id) {
			return isFavoriteProduct(id);
		};

		$scope.gaSend = function() {
			customGA('Detail', 'RelatedProduct', 'ItemClick');
		};
	});

	$http({
		method: 'GET',
		url: "https://data.doraeshop.vn/api/v1/gifts.json",
		headers: {
			'Content-Type': 'application/json; charset=utf-8'
		}})
	.then(function(response) {
		var gifts=response.data.data;
		if (gifts.includes(detailId)) {
			$('#more-info > tbody').append('<tr><td width="35"><div class="hand-right"></div></td><td>Hãy tiến hành đặt hàng ngay sau đó vào trang <a href="https://doraeshop.vn/vong-xoay-may-man" id="wheel">Quay số trúng thẻ cào</a> để tìm cho mình phần thưởng nhé. Chúc các bạn may mắn</td></tr>');
		}
	});
});


app.controller('quantityController', function($scope) {
	var arr=[];
	for (var i = 0; i <50; i++) {
		arr.push(i+1);
	}
	$scope.quantity=arr;
});

function isOverSell() {
	if (inventory.hasOwnProperty("default")) {
		return inventory.default==0;
	}

	return inventory[cacheOption]==0;
}

function isDifferentDeliveryTime() {
	var itemIDs=localStorage.CartList;
	var ids=[];
	if (itemIDs!=null) {
		ids=itemIDs.split(",");
	}

	for (i=0;i<ids.length;i++) {
		var item=JSON.parse(localStorage.getItem("Cart"+ids[i]));
		if (item.deliveryId!=mainDeliveryId) {
			return true;
		}
	}

	return false;
}


function addNewToCart() {
	if (isOverSell()) {
		if (extra) {
			$("#detail-oversell").text(" ("+extra+")");
		}
		$("#oversell-name").val("");
		$("#oversell-phone").val("");
		$('#oversell-modal').modal('show');

		makeOneSignal(function() {
			var map={};
			map["oversell"+detailId+(cacheOption==null? "":("|"+cacheOption))]= cacheOption==null ? overSellIndex.default: overSellIndex[cacheOption];
			OneSignal.sendTags(map);
		});
	}
	else if (isDifferentDeliveryTime()) {
		$("#add-cart-confirm-modal").modal('show');
	}
	else {
		addProductDirectly();
	}
}


function addProductDirectly() {
	$("#add-cart-confirm-modal").modal('hide');
	var itemIDs=localStorage.CartList;
	var ids=[];
	if (itemIDs!=null) {
		ids=itemIDs.split(",");
	}

	var newId=Math.floor((Math.random() * 10000) + 1);

	while (ids.includes(newId.toString())) {
		newId=Math.floor((Math.random() * 10000) + 1);
	}

	ids.unshift(newId.toString());
	localStorage.setItem("CartList", ids.join(","));

	var item={
		"img":mainImg,
		"title":$("#title").text(),
		"count":$("#full-quantity").prop('selectedIndex')+1,
		"price":mutablePriceValue,
		"extra":extra,
		"detailId":detailId,
		"cacheOption":cacheOption,
		"weight":weight,
		"isExpressSupport":isExpressSupport,
		"deliveryId":mainDeliveryId
	};

	localStorage.setItem("Cart"+newId, JSON.stringify(item));
	openDialogBroadcast('cart');
	showToast("success","Giỏ hàng","Đã thêm thành công");
	customGA('Detail', 'Cart', 'Add');
	productLikeOrOrder(detailId);
}


function addOrRemoveFavorite() {
	var itemIDs=localStorage.FavoriteList;
	var ids=[];
	if (itemIDs!=null) {
		ids=itemIDs.split(",");
	}

	if (liked) {
		customGA('Detail', 'Favorite', 'Unlike');
		ids.splice(ids.indexOf(detailId.toString()),1);
		localStorage.removeItem("Favorite"+detailId);
		if (ids.length==0) {
			localStorage.removeItem("FavoriteList");
		}
		else {
			localStorage.setItem("FavoriteList", ids.join(","));
		}
		showToast("success","Yêu thích","Đã bỏ yêu thích thành công");
		$("#bookmark-product").text("Yêu thích");
	}
	else {
		customGA('Detail', 'Favorite', 'Like');
		ids.unshift(detailId.toString());
		localStorage.setItem("FavoriteList", ids.join(","));

		var item={
			"img":mainImg,
			"title":$("#title").text(),
			"price":priceValue,
			"realPrice":realPriceValue,
			"discountPercent":discountPercentValue,
			"url":window.location.href.split("/san-pham/")[1]
		};

		localStorage.setItem("Favorite"+detailId, JSON.stringify(item));
		showToast("success","Yêu thích","Đã yêu thích thành công");
		$("#bookmark-product").text("Bỏ yêu thích");
	}
	openDialogBroadcast('favorite');
	liked=!liked;
	productLikeOrOrder(detailId);
}

function sendOverSellInfo() {
	var name=$("#oversell-name").val();
	var phone=$("#oversell-phone").val();

	if (!name) {
		showToast("error","Lỗi","Tên không hợp lệ");
		return;
	}

	if (!phone || !isNumeric(phone)) {
		showToast("error","Lỗi","Số điện thoại không hợp lệ");
		return;
	}

	$('#oversell-modal').data('bs.modal').backdrop = 'static';
	$('#oversell-modal').data('bs.modal')._config.backdrop = 'static';
	$('#oversell-modal').data('bs.modal').keyboard = true;
	$("#oversell-footer-modal").css("display","none");
	$("#oversell-sending").css("display","block");
	customGA('Detail', 'OversellSend', detailId.toString());

	var scope = angular.element(document.getElementById('oversell-http')).scope();
	scope.send();
}

$('#oversell-modal').on('hidden.bs.modal', function (e) {
	if (isHiding) {
		isHiding=false;
	}
	else {
		customGA('Detail', 'OversellNotSend', detailId.toString());
	}
});

$(function() {
	$('.lazy').Lazy({
		visibleOnly:true,
		threshold:50,
		effect:"fadeIn",
		effectTime: 2000,
		defaultImage:"data:image/png;base64,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1uKGVsgISKwMiqHFBSTW4oZWyAhIrAyKocUFJNbihlbICEisDIqhxQUk1uKGVsgISKwMiqHFBSTW4oZWyAhIrAyKocUFJNbihlbICEisDIqhxQUk1uKGVsgISKwMiqHFBSTW4oZWyAhIrAyKocUFJNbihlbICEisDIqhxQUk1uKGVsgISKwMiqHFBSTW4oZWyAhIrAyKocUFJNbihlbICEisDIqhxQUk1uKGVsgISKwMiqHFBSTW4oZWyAj4f//KoBgiQGA5Bfwv4XJeF++KAIGMgIKVQTFEgMByCihYy3ldvCsCBDICClYGxRABAsspoGAt53XxrggQyAgoWBkUQwQILKeAgrWc18W7IkAgI6BgZVAMESCwnAIK1nJeF++KAIGMgIKVQTFEgMByCihYy3ldvCsCBDICClYGxRABAsspoGAt53XxrggQyAgoWBkUQwQILKeAgrWc18W7IkAgI6BgZVAMESCwnAIK1nJeF++KAIGMgIKVQTFEgMByCihYy3ldvCsCBDICClYGxRABAsspoGAt53XxrggQyAgoWBkUQwQILKeAgrWc18W7IkAgI6BgZVAMESCwnAIK1nJeF++KAIGMgIKVQTFEgMByCihYy3ldvCsCBDICClYGxRABAsspoGAt53XxrggQyAgoWBkUQwQILKeAgrWc18W7IkAgI6BgZVAMESCwnAIK1nJeF++KAIGMgIKVQTFEgMByCihYy3ldvCsCBDICClYGxRABAsspoGAt53XxrggQyAgoWBkUQwQILKeAgrWc18W7IkAgI6BgZVAMESCwnAIK1nJeF++KAIGMgIKVQTFEgMByCihYy3ldvCsCBDICClYGxRABAsspoGAt53XxrggQyAisZsYMEZhL4He/+1137NixuebOJu3s7HQXLlzoLl++PBvyncDcAgrW3FQm7hX44x//uFusUhE6cuRI99VXX3X379/vHj161G1tbXVpfGVlpX8tFalDhw71S9y5c0fB2ovp+dwCCtbcVCbuFUiFKD0OHjzY3bx5s/++urranT59unv11Ve7GzdudD/72c+6x48f918ff/xxX8DeeuutbmNjY+9SnhOYW0DBmpvKxJzA5uZm98Ybb/QdVSpin3zySbe9vd29+eab3dOnT7sDBw50J06c6I//+te/9q/l1jFGYB4BN93nUTLnuQKpSKWOKf34d/36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"
	});
});